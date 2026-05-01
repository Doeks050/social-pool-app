import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import AdminResultsDateGroup from "@/components/world-cup/AdminResultsDateGroup";
import ResetAllResultsButton from "@/components/world-cup/ResetAllResultsButton";
import { createClient } from "@/lib/supabase";
import type { WorldCupMatchRow } from "@/lib/world-cup/slotResolver";

type ResultsPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
    phase?: string;
  }>;
};

type PhaseOption = {
  value: string;
  label: string;
};

type SyncableWorldCupMatchRow = WorldCupMatchRow & {
  home_team_locked_by_admin: boolean;
  away_team_locked_by_admin: boolean;
  match_number: number | null;
};

type DateGroup = {
  key: string;
  label: string;
  matches: SyncableWorldCupMatchRow[];
};

type MatchOptions = {
  homeOptions: string[];
  awayOptions: string[];
};

type WorldCupMatchIdRow = {
  id: string;
};

const PHASE_OPTIONS: PhaseOption[] = [
  { value: "all", label: "Alles" },
  { value: "group", label: "Groepsfase" },
  { value: "round_of_32", label: "Round of 32" },
  { value: "round_of_16", label: "Round of 16" },
  { value: "quarterfinal", label: "Kwartfinales" },
  { value: "semifinal", label: "Halve finales" },
  { value: "third_place", label: "Troostfinale" },
  { value: "final", label: "Finale" },
];

function getAmsterdamDateParts(value: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return { year, month, day };
}

function getDateKey(value: string) {
  const { year, month, day } = getAmsterdamDateParts(value);
  return `${year}-${month}-${day}`;
}

function getDateLabel(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

function normalizePhase(value: string | undefined) {
  if (!value) {
    return "all";
  }

  const valid = PHASE_OPTIONS.some((option) => option.value === value);
  return valid ? value : "all";
}

function buildPhaseHref(phase: string) {
  if (phase === "all") {
    return "/admin/world-cup/results";
  }

  return `/admin/world-cup/results?phase=${encodeURIComponent(phase)}`;
}

function matchesPhase(match: WorldCupMatchRow, phase: string) {
  if (phase === "all") {
    return true;
  }

  return (match.stage_type ?? "").toLowerCase() === phase;
}

function buildAllTournamentTeams(matches: SyncableWorldCupMatchRow[]) {
  const teamSet = new Set<string>();

  for (const match of matches) {
    if (match.home_team?.trim()) {
      teamSet.add(match.home_team.trim());
    }

    if (match.away_team?.trim()) {
      teamSet.add(match.away_team.trim());
    }
  }

  return Array.from(teamSet).sort((a, b) => a.localeCompare(b));
}

function buildGroupTeamsMap(matches: SyncableWorldCupMatchRow[]) {
  const groupMap = new Map<string, Set<string>>();

  for (const match of matches) {
    const stageType = (match.stage_type ?? "").toLowerCase();

    if (stageType !== "group") {
      continue;
    }

    const label = (match.group_label ?? "").trim();

    if (!label) {
      continue;
    }

    if (!groupMap.has(label)) {
      groupMap.set(label, new Set<string>());
    }

    const teamSet = groupMap.get(label)!;

    if (match.home_team?.trim()) {
      teamSet.add(match.home_team.trim());
    }

    if (match.away_team?.trim()) {
      teamSet.add(match.away_team.trim());
    }
  }

  const result = new Map<string, string[]>();

  for (const [groupLabel, teams] of groupMap.entries()) {
    result.set(
      groupLabel,
      Array.from(teams).sort((a, b) => a.localeCompare(b))
    );
  }

  return result;
}

function extractGroupLabelFromSlot(slot: string | null) {
  if (!slot) return null;

  const normalized = slot.trim().toLowerCase();
  const match = normalized.match(/^(winner|runnerup)_group_([a-z0-9]+)$/i);

  if (!match) {
    return null;
  }

  return `Group ${match[2].toUpperCase()}`;
}

function getTeamsForSlot(
  slot: string | null,
  allTeams: string[],
  groupTeamsMap: Map<string, string[]>
) {
  const groupLabel = extractGroupLabelFromSlot(slot);

  if (!groupLabel) {
    return allTeams;
  }

  const groupTeams = groupTeamsMap.get(groupLabel);

  if (!groupTeams || groupTeams.length === 0) {
    return allTeams;
  }

  return groupTeams;
}

function buildResetAllHref(successOrError: "success" | "error", message: string) {
  return `/admin/world-cup/results?${successOrError}=${encodeURIComponent(
    message
  )}`;
}

export default async function WorldCupResultsPage({
  searchParams,
}: ResultsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const successMessage = resolvedSearchParams?.success
    ? decodeURIComponent(resolvedSearchParams.success)
    : null;
  const errorMessage = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : null;
  const activePhase = normalizePhase(resolvedSearchParams?.phase);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: appAdmin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!appAdmin) {
    notFound();
  }

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      "id, stage, round_name, stage_type, group_label, round_order, match_number, bracket_code, starts_at, status, home_team, away_team, home_slot, away_slot, home_score, away_score, is_knockout, home_team_locked_by_admin, away_team_locked_by_admin"
    )
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true })
    .order("match_number", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="py-16">
          <Container>
            <div className="mx-auto max-w-5xl rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              {error.message}
            </div>
          </Container>
        </section>
      </main>
    );
  }

  const allMatches = (matches ?? []) as SyncableWorldCupMatchRow[];
  const allTournamentTeams = buildAllTournamentTeams(allMatches);
  const groupTeamsMap = buildGroupTeamsMap(allMatches);

  const typedMatches = allMatches.filter((match) =>
    matchesPhase(match, activePhase)
  );

  const finishedCount = allMatches.filter(
    (match) => match.status === "finished"
  ).length;

  const dateGroupMap = new Map<string, SyncableWorldCupMatchRow[]>();

  for (const match of typedMatches) {
    const key = getDateKey(match.starts_at);
    const existing = dateGroupMap.get(key) ?? [];
    existing.push(match);
    dateGroupMap.set(key, existing);
  }

  const groupedMatches: DateGroup[] = Array.from(dateGroupMap.entries())
    .map(([key, dateMatches]) => ({
      key,
      label: getDateLabel(dateMatches[0].starts_at),
      matches: [...dateMatches].sort((a, b) => {
        const aTime = new Date(a.starts_at).getTime();
        const bTime = new Date(b.starts_at).getTime();

        if (aTime !== bTime) {
          return aTime - bTime;
        }

        const aMatchNumber = a.match_number ?? Number.MAX_SAFE_INTEGER;
        const bMatchNumber = b.match_number ?? Number.MAX_SAFE_INTEGER;

        return aMatchNumber - bMatchNumber;
      }),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const matchOptions: Record<string, MatchOptions> = {};

  for (const match of typedMatches) {
    matchOptions[match.id] = {
      homeOptions: getTeamsForSlot(
        match.home_slot,
        allTournamentTeams,
        groupTeamsMap
      ),
      awayOptions: getTeamsForSlot(
        match.away_slot,
        allTournamentTeams,
        groupTeamsMap
      ),
    };
  }

  async function resetAllResults() {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth");
    }

    const { data: appAdmin } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!appAdmin) {
      redirect(
        buildResetAllHref(
          "error",
          "WK reset mislukt: je bent geen app admin."
        )
      );
    }

    const { data: worldCupMatches, error: worldCupMatchesError } =
      await supabase
        .from("matches")
        .select("id")
        .eq("tournament", "world_cup_2026");

    if (worldCupMatchesError) {
      redirect(
        buildResetAllHref(
          "error",
          `WK-wedstrijden ophalen mislukt: ${worldCupMatchesError.message}`
        )
      );
    }

    const worldCupMatchIds = ((worldCupMatches ?? []) as WorldCupMatchIdRow[])
      .map((match) => match.id)
      .filter(Boolean);

    if (worldCupMatchIds.length > 0) {
      const { error: predictionsError } = await supabase
        .from("predictions")
        .update({
          points_awarded: 0,
        })
        .in("match_id", worldCupMatchIds);

      if (predictionsError) {
        redirect(
          buildResetAllHref(
            "error",
            `Punten resetten mislukt: ${predictionsError.message}`
          )
        );
      }
    }

    const { error: resetAllScoresError } = await supabase
      .from("matches")
      .update({
        home_score: null,
        away_score: null,
        status: "upcoming",
      })
      .eq("tournament", "world_cup_2026");

    if (resetAllScoresError) {
      redirect(
        buildResetAllHref(
          "error",
          `Wedstrijduitslagen resetten mislukt: ${resetAllScoresError.message}`
        )
      );
    }

    const { error: resetKnockoutTeamsError } = await supabase
      .from("matches")
      .update({
        home_team: null,
        away_team: null,
        home_team_locked_by_admin: false,
        away_team_locked_by_admin: false,
      })
      .eq("tournament", "world_cup_2026")
      .neq("stage_type", "group");

    if (resetKnockoutTeamsError) {
      redirect(
        buildResetAllHref(
          "error",
          `Knock-out teams resetten mislukt: ${resetKnockoutTeamsError.message}`
        )
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/world-cup/results");
    revalidatePath("/admin/world-cup/sync");
    revalidatePath("/pools/[id]/matches", "page");
    revalidatePath("/pools/[id]/bracket", "page");
    revalidatePath("/pools/[id]/leaderboard", "page");

    redirect(
      buildResetAllHref(
        "success",
        "WK is gereset. Scores, punten en automatisch ingevulde knock-outteams zijn leeggemaakt. Voorspellingen zijn bewaard."
      )
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-6 sm:py-8">
        <Container>
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            <div>
              <Link
                href="/admin"
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar admin
              </Link>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                App admin
              </p>

              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    WK resultaten beheren
                  </h1>
                  <p className="mt-1 text-sm text-zinc-400">
                    {finishedCount}/{allMatches.length} wedstrijden hebben een
                    ingevulde uitslag.
                  </p>
                </div>

                <ResetAllResultsButton action={resetAllResults} />
              </div>
            </div>

            {successMessage ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5">
              <div className="flex flex-wrap gap-2">
                {PHASE_OPTIONS.map((option) => {
                  const isActive = option.value === activePhase;

                  return (
                    <Link
                      key={option.value}
                      href={buildPhaseHref(option.value)}
                      className={
                        isActive
                          ? "rounded-full border border-white bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950"
                          : "rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                      }
                    >
                      {option.label}
                    </Link>
                  );
                })}
              </div>
            </section>

            {groupedMatches.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center text-zinc-400">
                Geen wedstrijden gevonden voor deze filter.
              </div>
            ) : (
              <div className="space-y-2">
                {groupedMatches.map((group, index) => (
                  <AdminResultsDateGroup
                    key={group.key}
                    label={group.label}
                    matches={group.matches}
                    matchOptions={matchOptions}
                    defaultOpen={index === 0}
                  />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
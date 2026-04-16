import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import MatchResultAdminCard from "@/components/world-cup/MatchResultAdminCard";
import { createClient } from "@/lib/supabase";
import { syncKnockoutTeams } from "@/lib/world-cup/syncKnockoutTeams";
import type { WorldCupMatchRow } from "@/lib/world-cup/slotResolver";
import { getPredictionPoints } from "@/lib/world-cup-scoring";

type ResultsPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
    phase?: string;
  }>;
};

type PredictionRow = {
  id: string;
  pool_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
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

function isKnockoutLike(match: WorldCupMatchRow) {
  return (match.stage_type ?? "").toLowerCase() !== "group";
}

function prettifySlot(slot: string | null) {
  if (!slot) return "Automatische plek";

  return slot
    .replace(/_/g, " ")
    .replace(/\bgroup\b/gi, "Group")
    .replace(/\bwinner\b/gi, "Winner")
    .replace(/\brunnerup\b/gi, "Runner-up")
    .replace(/\bloser\b/gi, "Loser")
    .replace(/\bround\b/gi, "Round")
    .replace(/\bof\b/gi, "of")
    .replace(/\bquarterfinal\b/gi, "Quarterfinal")
    .replace(/\bsemifinal\b/gi, "Semifinal")
    .replace(/\bfinal\b/gi, "Final");
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
    if (stageType !== "group") continue;

    const label = (match.group_label ?? "").trim();
    if (!label) continue;

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

async function scorePredictionsForMatch(
  matchId: string,
  actualHomeScore: number,
  actualAwayScore: number
) {
  const supabase = await createClient();

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select("id, pool_id, predicted_home_score, predicted_away_score")
    .eq("match_id", matchId);

  if (predictionsError) {
    throw new Error(predictionsError.message);
  }

  const typedPredictions = (predictions ?? []) as PredictionRow[];

  for (const prediction of typedPredictions) {
    const points = getPredictionPoints(
      {
        home: prediction.predicted_home_score,
        away: prediction.predicted_away_score,
      },
      {
        home: actualHomeScore,
        away: actualAwayScore,
      }
    );

    const { error: updatePredictionError } = await supabase
      .from("predictions")
      .update({
        points_awarded: points,
      })
      .eq("id", prediction.id);

    if (updatePredictionError) {
      throw new Error(updatePredictionError.message);
    }
  }

  const uniquePoolIds = [...new Set(typedPredictions.map((item) => item.pool_id))];

  for (const poolId of uniquePoolIds) {
    revalidatePath(`/pools/${poolId}`);
    revalidatePath(`/pools/${poolId}/matches`);
    revalidatePath(`/pools/${poolId}/leaderboard`);
    revalidatePath(`/pools/${poolId}/bracket`);
    revalidatePath(`/pools/${poolId}/bonus`);
  }
}

async function saveMatchResult(formData: FormData) {
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
    notFound();
  }

  const matchId = String(formData.get("match_id") ?? "").trim();
  const homeScoreRaw = String(formData.get("home_score") ?? "").trim();
  const awayScoreRaw = String(formData.get("away_score") ?? "").trim();

  if (!matchId) {
    redirect(
      "/admin/world-cup/results?error=" +
        encodeURIComponent("Geen wedstrijd id ontvangen.")
    );
  }

  const homeScore = Number(homeScoreRaw);
  const awayScore = Number(awayScoreRaw);

  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    redirect(
      "/admin/world-cup/results?error=" +
        encodeURIComponent("Scores moeten gehele getallen van 0 of hoger zijn.")
    );
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "finished",
    })
    .eq("id", matchId);

  if (updateError) {
    redirect(
      "/admin/world-cup/results?error=" +
        encodeURIComponent(updateError.message)
    );
  }

  try {
    await scorePredictionsForMatch(matchId, homeScore, awayScore);
    await syncKnockoutTeams(supabase);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Onbekende fout tijdens score/sync verwerking.";

    redirect(
      "/admin/world-cup/results?error=" + encodeURIComponent(message)
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/world-cup/results");
  revalidatePath("/admin/world-cup/sync");
  revalidatePath("/pools/[id]", "page");
  revalidatePath("/pools/[id]/matches", "page");
  revalidatePath("/pools/[id]/leaderboard", "page");
  revalidatePath("/pools/[id]/bracket", "page");
  revalidatePath("/pools/[id]/bonus", "page");

  redirect(
    "/admin/world-cup/results?success=" +
      encodeURIComponent(
        "Resultaat opgeslagen, punten berekend en knock-out schema gesynchroniseerd."
      )
  );
}

async function saveKnockoutSideOverride(formData: FormData) {
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
    notFound();
  }

  const matchId = String(formData.get("match_id") ?? "").trim();
  const side = String(formData.get("side") ?? "").trim();
  const teamName = String(formData.get("team_name") ?? "").trim();

  if (!matchId || (side !== "home" && side !== "away")) {
    redirect(
      "/admin/world-cup/results?error=" +
        encodeURIComponent("Ongeldige override invoer.")
    );
  }

  const updatePayload =
    side === "home"
      ? {
          home_team: teamName || null,
          home_team_locked_by_admin: true,
        }
      : {
          away_team: teamName || null,
          away_team_locked_by_admin: true,
        };

  const { error } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", matchId);

  if (error) {
    redirect(
      "/admin/world-cup/results?error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/admin/world-cup/results");
  revalidatePath("/pools/[id]/matches", "page");
  revalidatePath("/pools/[id]/bracket", "page");

  redirect(
    "/admin/world-cup/results?success=" +
      encodeURIComponent(
        side === "home"
          ? "Home team handmatig opgeslagen."
          : "Away team handmatig opgeslagen."
      )
  );
}

async function resetKnockoutSideOverride(formData: FormData) {
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
    notFound();
  }

  const matchId = String(formData.get("match_id") ?? "").trim();
  const side = String(formData.get("side") ?? "").trim();

  if (!matchId || (side !== "home" && side !== "away")) {
    redirect(
      "/admin/world-cup/results?error=" +
        encodeURIComponent("Ongeldige reset invoer.")
    );
  }

  const updatePayload =
    side === "home"
      ? {
          home_team_locked_by_admin: false,
        }
      : {
          away_team_locked_by_admin: false,
        };

  const { error: unlockError } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", matchId);

  if (unlockError) {
    redirect(
      "/admin/world-cup/results?error=" +
        encodeURIComponent(unlockError.message)
    );
  }

  try {
    await syncKnockoutTeams(supabase);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Onbekende sync fout.";

    redirect(
      "/admin/world-cup/results?error=" + encodeURIComponent(message)
    );
  }

  revalidatePath("/admin/world-cup/results");
  revalidatePath("/pools/[id]/matches", "page");
  revalidatePath("/pools/[id]/bracket", "page");

  redirect(
    "/admin/world-cup/results?success=" +
      encodeURIComponent(
        side === "home"
          ? "Home team reset naar auto-sync."
          : "Away team reset naar auto-sync."
      )
  );
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
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                WK resultaten beheren
              </h1>
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
              <div className="space-y-3">
                {groupedMatches.map((group) => (
                  <section
                    key={group.key}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
                  >
                    <div className="mb-2 flex items-end justify-between gap-3 border-b border-zinc-800 pb-2">
                      <h2 className="text-sm font-semibold capitalize text-white sm:text-base">
                        {group.label}
                      </h2>
                      <p className="text-[11px] text-zinc-500">
                        {group.matches.length}{" "}
                        {group.matches.length === 1
                          ? "wedstrijd"
                          : "wedstrijden"}
                      </p>
                    </div>

                    <div className="grid gap-2 lg:grid-cols-2">
                      {group.matches.map((match) => {
                        const homeOptions = getTeamsForSlot(
                          match.home_slot,
                          allTournamentTeams,
                          groupTeamsMap
                        );
                        const awayOptions = getTeamsForSlot(
                          match.away_slot,
                          allTournamentTeams,
                          groupTeamsMap
                        );

                        return (
                          <div
                            key={match.id}
                            className="space-y-2 rounded-xl border border-zinc-800/60 bg-zinc-950/20 p-2"
                          >
                            <MatchResultAdminCard
                              match={match}
                              saveAction={saveMatchResult}
                            />

                            {isKnockoutLike(match) ? (
                              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                                <div className="mb-2">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                                    Handmatige knockout override
                                  </p>
                                  <p className="mt-1 text-[11px] text-zinc-400">
                                    Groepsslots tonen alleen landen uit de juiste groep.
                                  </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-md border border-zinc-800 bg-zinc-950/40 p-2.5">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
                                          Home side
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-zinc-500">
                                          {prettifySlot(match.home_slot)}
                                        </p>
                                      </div>

                                      {match.home_team_locked_by_admin ? (
                                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                                          Locked
                                        </span>
                                      ) : (
                                        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                          Auto
                                        </span>
                                      )}
                                    </div>

                                    <form action={saveKnockoutSideOverride} className="space-y-2">
                                      <input type="hidden" name="match_id" value={match.id} />
                                      <input type="hidden" name="side" value="home" />

                                      <select
                                        name="team_name"
                                        defaultValue={match.home_team ?? ""}
                                        className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition focus:border-white"
                                      >
                                        <option value="">Kies land</option>
                                        {homeOptions.map((team) => (
                                          <option key={`home-${match.id}-${team}`} value={team}>
                                            {team}
                                          </option>
                                        ))}
                                      </select>

                                      <button
                                        type="submit"
                                        className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-950 transition hover:bg-zinc-200"
                                      >
                                        Home opslaan
                                      </button>
                                    </form>

                                    <form action={resetKnockoutSideOverride} className="mt-2">
                                      <input type="hidden" name="match_id" value={match.id} />
                                      <input type="hidden" name="side" value="home" />

                                      <button
                                        type="submit"
                                        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                                      >
                                        Reset home
                                      </button>
                                    </form>
                                  </div>

                                  <div className="rounded-md border border-zinc-800 bg-zinc-950/40 p-2.5">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
                                          Away side
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-zinc-500">
                                          {prettifySlot(match.away_slot)}
                                        </p>
                                      </div>

                                      {match.away_team_locked_by_admin ? (
                                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                                          Locked
                                        </span>
                                      ) : (
                                        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                          Auto
                                        </span>
                                      )}
                                    </div>

                                    <form action={saveKnockoutSideOverride} className="space-y-2">
                                      <input type="hidden" name="match_id" value={match.id} />
                                      <input type="hidden" name="side" value="away" />

                                      <select
                                        name="team_name"
                                        defaultValue={match.away_team ?? ""}
                                        className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition focus:border-white"
                                      >
                                        <option value="">Kies land</option>
                                        {awayOptions.map((team) => (
                                          <option key={`away-${match.id}-${team}`} value={team}>
                                            {team}
                                          </option>
                                        ))}
                                      </select>

                                      <button
                                        type="submit"
                                        className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-950 transition hover:bg-zinc-200"
                                      >
                                        Away opslaan
                                      </button>
                                    </form>

                                    <form action={resetKnockoutSideOverride} className="mt-2">
                                      <input type="hidden" name="match_id" value={match.id} />
                                      <input type="hidden" name="side" value="away" />

                                      <button
                                        type="submit"
                                        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                                      >
                                        Reset away
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
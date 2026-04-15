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

type DateGroup = {
  key: string;
  label: string;
  matches: WorldCupMatchRow[];
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
      "id, stage, round_name, stage_type, group_label, round_order, bracket_code, starts_at, status, home_team, away_team, home_slot, away_slot, home_score, away_score, is_knockout"
    )
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true });

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

  const typedMatches = ((matches ?? []) as WorldCupMatchRow[]).filter((match) =>
    matchesPhase(match, activePhase)
  );

  const dateGroupMap = new Map<string, WorldCupMatchRow[]>();

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
      matches: [...dateMatches].sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      ),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-8 sm:py-10">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            <div>
              <Link
                href="/admin"
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar admin
              </Link>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
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
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:p-4"
                  >
                    <div className="mb-2">
                      <h2 className="text-sm font-semibold capitalize text-white sm:text-base">
                        {group.label}
                      </h2>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {group.matches.length}{" "}
                        {group.matches.length === 1
                          ? "wedstrijd"
                          : "wedstrijden"}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      {group.matches.map((match) => (
                        <MatchResultAdminCard
                          key={match.id}
                          match={match}
                          saveAction={saveMatchResult}
                        />
                      ))}
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
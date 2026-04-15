import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import MatchPredictionCard from "@/components/world-cup/MatchPredictionCard";

type PoolMatchesPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    filter?: string;
  }>;
};

type PredictionRow = {
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_awarded: number | null;
};

type MatchRow = {
  id: string;
  stage: string | null;
  round_name: string | null;
  stage_type: string | null;
  group_label: string | null;
  round_order: number | null;
  bracket_code: string | null;
  starts_at: string;
  status: string;
  home_team: string | null;
  away_team: string | null;
  home_slot: string | null;
  away_slot: string | null;
  home_score: number | null;
  away_score: number | null;
  is_knockout: boolean | null;
};

type DateGroup = {
  key: string;
  label: string;
  matches: MatchRow[];
};

type MatchFilter = "all" | "open" | "locked" | "finished";

function getMatchState(match: MatchRow): "open" | "locked" | "finished" {
  const hasResult =
    match.status === "finished" &&
    match.home_score !== null &&
    match.away_score !== null;

  if (hasResult) {
    return "finished";
  }

  if (new Date(match.starts_at).getTime() <= Date.now()) {
    return "locked";
  }

  return "open";
}

function normalizeFilter(filter?: string): MatchFilter {
  if (filter === "open") return "open";
  if (filter === "locked") return "locked";
  if (filter === "finished") return "finished";
  return "all";
}

function matchesFilter(match: MatchRow, activeFilter: MatchFilter) {
  if (activeFilter === "all") return true;
  return getMatchState(match) === activeFilter;
}

function getFilterHref(poolId: string, filter: MatchFilter) {
  if (filter === "all") {
    return `/pools/${poolId}/matches`;
  }

  return `/pools/${poolId}/matches?filter=${filter}`;
}

function getFilterButtonClasses(isActive: boolean) {
  if (isActive) {
    return "border-white bg-white text-zinc-950";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white";
}

function getDateKey(value: string) {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

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

export default async function PoolMatchesPage({
  params,
  searchParams,
}: PoolMatchesPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const activeFilter = normalizeFilter(resolvedSearchParams.filter);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: pool } = await supabase
    .from("pools")
    .select("id, name, game_type")
    .eq("id", id)
    .maybeSingle();

  if (!pool || pool.game_type !== "world_cup") {
    notFound();
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, stage, round_name, stage_type, group_label, round_order, bracket_code, starts_at, status, home_team, away_team, home_slot, away_slot, home_score, away_score, is_knockout"
    )
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select(
      "match_id, predicted_home_score, predicted_away_score, points_awarded"
    )
    .eq("pool_id", pool.id)
    .eq("user_id", user.id);

  const typedMatches = (matches ?? []) as MatchRow[];

  const predictionMap = new Map(
    ((predictions ?? []) as PredictionRow[]).map((prediction) => [
      prediction.match_id,
      prediction,
    ])
  );

  const filteredMatches = typedMatches.filter((match) =>
    matchesFilter(match, activeFilter)
  );

  const dateGroupMap = new Map<string, MatchRow[]>();

  for (const match of filteredMatches) {
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

  const totalOpen = typedMatches.filter(
    (match) => getMatchState(match) === "open"
  ).length;
  const totalLocked = typedMatches.filter(
    (match) => getMatchState(match) === "locked"
  ).length;
  const totalFinished = typedMatches.filter(
    (match) => getMatchState(match) === "finished"
  ).length;
  const totalAll = typedMatches.length;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-10 sm:py-12">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <div>
              <Link
                href={`/pools/${pool.id}`}
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar pool
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                WK wedstrijden
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {pool.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Wedstrijden staan hieronder compact gegroepeerd per speeldatum.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={getFilterHref(pool.id, "all")}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${getFilterButtonClasses(
                    activeFilter === "all"
                  )}`}
                >
                  Alles ({totalAll})
                </Link>

                <Link
                  href={getFilterHref(pool.id, "open")}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${getFilterButtonClasses(
                    activeFilter === "open"
                  )}`}
                >
                  Open ({totalOpen})
                </Link>

                <Link
                  href={getFilterHref(pool.id, "locked")}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${getFilterButtonClasses(
                    activeFilter === "locked"
                  )}`}
                >
                  Gelockt ({totalLocked})
                </Link>

                <Link
                  href={getFilterHref(pool.id, "finished")}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${getFilterButtonClasses(
                    activeFilter === "finished"
                  )}`}
                >
                  Finished ({totalFinished})
                </Link>
              </div>
            </div>

            {groupedMatches.length > 0 ? (
              <div className="space-y-4">
                {groupedMatches.map((group) => (
                  <section
                    key={group.key}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
                  >
                    <div className="mb-3">
                      <h2 className="text-base font-semibold capitalize text-white sm:text-lg">
                        {group.label}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {group.matches.length}{" "}
                        {group.matches.length === 1
                          ? "wedstrijd"
                          : "wedstrijden"}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {group.matches.map((match) => (
                        <MatchPredictionCard
                          key={match.id}
                          match={match}
                          initialPrediction={predictionMap.get(match.id) ?? null}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5">
                <h2 className="text-lg font-semibold">
                  Geen wedstrijden gevonden voor deze filter
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Kies een andere filter of bekijk alle wedstrijden.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
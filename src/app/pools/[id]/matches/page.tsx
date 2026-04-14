import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import MatchPredictionCard from "@/components/world-cup/MatchPredictionCard";

type PoolMatchesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PredictionRow = {
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
};

type MatchRow = {
  id: string;
  stage: string;
  round_name: string;
  home_team: string;
  away_team: string;
  starts_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

type MatchGroup = {
  key: string;
  label: string;
  matches: MatchRow[];
};

function getGroupLabel(match: MatchRow) {
  const round = match.round_name?.trim();
  const stage = match.stage?.trim();

  if (round) return round;
  if (stage) return stage;
  return "Overig";
}

function getGroupOrder(label: string) {
  const normalized = label.trim().toLowerCase();

  if (
    normalized.includes("group") ||
    normalized.includes("groepsfase") ||
    normalized.includes("group stage")
  ) {
    return 1;
  }

  if (
    normalized.includes("round of 32") ||
    normalized.includes("laatste 32") ||
    normalized.includes("1/16")
  ) {
    return 2;
  }

  if (
    normalized.includes("round of 16") ||
    normalized.includes("laatste 16") ||
    normalized.includes("achtste finale") ||
    normalized.includes("1/8")
  ) {
    return 3;
  }

  if (
    normalized.includes("quarter") ||
    normalized.includes("kwartfinale") ||
    normalized.includes("1/4")
  ) {
    return 4;
  }

  if (
    normalized.includes("semi") ||
    normalized.includes("halve finale") ||
    normalized.includes("1/2")
  ) {
    return 5;
  }

  if (
    normalized.includes("third") ||
    normalized.includes("3rd") ||
    normalized.includes("derde plaats")
  ) {
    return 6;
  }

  if (normalized.includes("final") || normalized.includes("finale")) {
    return 7;
  }

  return 99;
}

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

function getMatchStateOrder(match: MatchRow) {
  const state = getMatchState(match);

  if (state === "open") return 0;
  if (state === "locked") return 1;
  return 2;
}

export default async function PoolMatchesPage({
  params,
}: PoolMatchesPageProps) {
  const { id } = await params;

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
      "id, stage, round_name, home_team, away_team, starts_at, status, home_score, away_score"
    )
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("match_id, predicted_home_score, predicted_away_score")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id);

  const typedMatches = (matches ?? []) as MatchRow[];

  const predictionMap = new Map(
    ((predictions ?? []) as PredictionRow[]).map((prediction) => [
      prediction.match_id,
      prediction,
    ])
  );

  const groupedMatchesMap = new Map<string, MatchRow[]>();

  for (const match of typedMatches) {
    const label = getGroupLabel(match);
    const existing = groupedMatchesMap.get(label) ?? [];
    existing.push(match);
    groupedMatchesMap.set(label, existing);
  }

  const groupedMatches: MatchGroup[] = Array.from(groupedMatchesMap.entries())
    .map(([label, groupMatches]) => ({
      key: label,
      label,
      matches: [...groupMatches].sort((a, b) => {
        const stateOrderDiff = getMatchStateOrder(a) - getMatchStateOrder(b);

        if (stateOrderDiff !== 0) {
          return stateOrderDiff;
        }

        return (
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        );
      }),
    }))
    .sort((a, b) => {
      const orderDiff = getGroupOrder(a.label) - getGroupOrder(b.label);

      if (orderDiff !== 0) {
        return orderDiff;
      }

      return a.label.localeCompare(b.label);
    });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-16">
        <Container>
          <div className="flex flex-col gap-6">
            <div>
              <Link
                href={`/pools/${pool.id}`}
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar pool
              </Link>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                WK wedstrijden
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {pool.name}
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Wedstrijden zijn hieronder gegroepeerd per fase. Binnen elke fase
                staan open wedstrijden bovenaan, daarna gelockte wedstrijden en
                finished wedstrijden onderaan.
              </p>
            </div>

            {groupedMatches.length > 0 ? (
              <div className="flex flex-col gap-4">
                {groupedMatches.map((group) => {
                  const openCount = group.matches.filter(
                    (match) => getMatchState(match) === "open"
                  ).length;
                  const lockedCount = group.matches.filter(
                    (match) => getMatchState(match) === "locked"
                  ).length;
                  const finishedCount = group.matches.filter(
                    (match) => getMatchState(match) === "finished"
                  ).length;

                  const defaultOpen = openCount > 0;

                  return (
                    <details
                      key={group.key}
                      open={defaultOpen}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/50"
                    >
                      <summary className="cursor-pointer list-none px-5 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-white">
                              {group.label}
                            </h2>
                            <p className="mt-1 text-sm text-zinc-400">
                              {group.matches.length}{" "}
                              {group.matches.length === 1
                                ? "wedstrijd"
                                : "wedstrijden"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                              Open: {openCount}
                            </span>
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-200">
                              Gelockt: {lockedCount}
                            </span>
                            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-200">
                              Finished: {finishedCount}
                            </span>
                          </div>
                        </div>
                      </summary>

                      <div className="border-t border-zinc-800 px-4 py-4">
                        <div className="grid gap-3">
                          {group.matches.map((match) => (
                            <MatchPredictionCard
                              key={match.id}
                              poolId={pool.id}
                              match={match}
                              initialPrediction={predictionMap.get(match.id) ?? null}
                            />
                          ))}
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6">
                <h2 className="text-xl font-semibold">
                  Er staan nog geen WK wedstrijden in de database
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  Voeg eerst wedstrijden toe aan de matches tabel.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
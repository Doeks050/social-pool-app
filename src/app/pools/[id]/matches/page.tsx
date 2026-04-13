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

  const groupedMatches: MatchGroup[] = Array.from(groupedMatchesMap.entries()).map(
    ([label, groupMatches]) => ({
      key: label,
      label,
      matches: groupMatches,
    })
  );

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
                Wedstrijden zijn hieronder gegroepeerd per fase. Open matches kun
                je nog voorspellen of aanpassen. Zodra een wedstrijd begint,
                wordt die automatisch gelockt.
              </p>
            </div>

            {groupedMatches.length > 0 ? (
              <div className="flex flex-col gap-8">
                {groupedMatches.map((group) => (
                  <section key={group.key} className="flex flex-col gap-4">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-semibold">{group.label}</h2>
                          <p className="mt-1 text-sm text-zinc-400">
                            {group.matches.length}{" "}
                            {group.matches.length === 1
                              ? "wedstrijd"
                              : "wedstrijden"}
                          </p>
                        </div>
                      </div>
                    </div>

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
                  </section>
                ))}
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
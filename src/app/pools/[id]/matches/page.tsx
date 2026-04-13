import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

type PoolMatchesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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
                Hier komen alle WK wedstrijden te staan. In de volgende stap
                koppelen we hier scorevoorspellingen aan.
              </p>
            </div>

            {matches && matches.length > 0 ? (
              <div className="grid gap-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
                            {match.stage}
                          </span>
                          <span className="text-sm text-zinc-400">
                            {match.round_name}
                          </span>
                        </div>

                        <h2 className="mt-3 text-xl font-semibold">
                          {match.home_team} vs {match.away_team}
                        </h2>

                        <p className="mt-2 text-sm text-zinc-400">
                          Start:{" "}
                          {new Date(match.starts_at).toLocaleString("nl-NL", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm">
                        {match.status === "finished" &&
                        match.home_score !== null &&
                        match.away_score !== null ? (
                          <div className="font-semibold text-white">
                            {match.home_score} - {match.away_score}
                          </div>
                        ) : (
                          <div className="font-semibold capitalize text-white">
                            {match.status}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6">
                <h2 className="text-xl font-semibold">
                  Er staan nog geen WK wedstrijden in de database
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  Dat is normaal voor deze stap. Hierna voegen we wedstrijddata
                  toe en daarna bouwen we predictions erbovenop.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
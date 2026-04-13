import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

type LeaderboardPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LeaderboardRow = {
  user_id: string;
  total_points: number;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
};

function getDisplayName(
  userId: string,
  profilesMap: Map<string, string>,
  currentUserId: string
) {
  const profileName = profilesMap.get(userId)?.trim();

  if (profileName) {
    return userId === currentUserId ? `${profileName} (jij)` : profileName;
  }

  const fallback = `Gebruiker ${userId.slice(0, 8)}`;
  return userId === currentUserId ? `${fallback} (jij)` : fallback;
}

export default async function PoolLeaderboardPage({
  params,
}: LeaderboardPageProps) {
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

  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, points_awarded")
    .eq("pool_id", pool.id);

  const totalsMap = new Map<string, number>();

  for (const prediction of predictions ?? []) {
    const current = totalsMap.get(prediction.user_id) ?? 0;
    totalsMap.set(prediction.user_id, current + (prediction.points_awarded ?? 0));
  }

  const leaderboard: LeaderboardRow[] = Array.from(totalsMap.entries())
    .map(([userId, totalPoints]) => ({
      user_id: userId,
      total_points: totalPoints,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  const userIds = leaderboard.map((entry) => entry.user_id);

  let profilesMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    profilesMap = new Map(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile.display_name ?? "",
      ])
    );
  }

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
                Ranglijst
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {pool.name}
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Deze ranglijst telt alle gescoorde WK voorspellingen binnen deze
                pool op.
              </p>
            </div>

            {leaderboard.length > 0 ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
                <div className="grid gap-3">
                  {leaderboard.map((entry, index) => {
                    const displayName = getDisplayName(
                      entry.user_id,
                      profilesMap,
                      user.id
                    );
                    const isCurrentUser = entry.user_id === user.id;

                    return (
                      <div
                        key={entry.user_id}
                        className={`rounded-2xl border p-4 ${
                          isCurrentUser
                            ? "border-white bg-zinc-950"
                            : "border-zinc-800 bg-zinc-950/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-zinc-400">
                              Positie #{index + 1}
                            </p>
                            <p className="mt-1 text-base font-medium text-white">
                              {displayName}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-zinc-400">Punten</p>
                            <p className="mt-1 text-xl font-semibold text-white">
                              {entry.total_points}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6">
                <h2 className="text-xl font-semibold">Nog geen scoredata</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Zodra wedstrijden finished zijn en predictions gescoord zijn,
                  verschijnt hier de ranglijst.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
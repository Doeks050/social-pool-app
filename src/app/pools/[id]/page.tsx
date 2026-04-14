import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import { getPoolTypeMeta } from "@/lib/pool-types";

type PoolPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PoolMemberRow = {
  user_id: string;
  role: string;
  joined_at: string;
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

export default async function PoolDetailPage({ params }: PoolPageProps) {
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
    .select("id, name, game_type, invite_code, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!pool) {
    notFound();
  }

  const { data: members } = await supabase
    .from("pool_members")
    .select("user_id, role, joined_at")
    .eq("pool_id", id)
    .order("joined_at", { ascending: true });

  const typedMembers = (members ?? []) as PoolMemberRow[];
  const memberUserIds = typedMembers.map((member) => member.user_id);

  let profilesMap = new Map<string, string>();

  if (memberUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", memberUserIds);

    profilesMap = new Map(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile.display_name ?? "",
      ])
    );
  }

  const poolType = getPoolTypeMeta(pool.game_type);
  const isWorldCup = pool.game_type === "world_cup";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-10 sm:py-12">
        <Container>
          <div
            className={`flex flex-col gap-4 ${
              isWorldCup ? "mx-auto max-w-3xl" : ""
            }`}
          >
            <div>
              <Link
                href="/dashboard"
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar dashboard
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {isWorldCup ? "WK pool" : "Pool overview"}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    {pool.name}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Speltype: {poolType.label}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm sm:min-w-[170px]">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Invite code
                  </div>
                  <div className="mt-1 text-base font-semibold tracking-wider text-white">
                    {pool.invite_code}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Jouw rol
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {membership.role}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Leden
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {typedMembers.length}{" "}
                  {typedMembers.length === 1 ? "lid" : "leden"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Pooltype
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {poolType.shortLabel}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {pool.game_type === "world_cup" ? (
                <>
                  <Link
                    href={`/pools/${pool.id}/matches`}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-600 hover:bg-zinc-900"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      WK
                    </p>
                    <h2 className="mt-2 text-base font-semibold">Wedstrijden</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Bekijk en vul je wedstrijdvoorspellingen in.
                    </p>
                  </Link>

                  <Link
                    href={`/pools/${pool.id}/bonus`}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-600 hover:bg-zinc-900"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      WK
                    </p>
                    <h2 className="mt-2 text-base font-semibold">Bonusvragen</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Vul je bonusvragen in vóór de eerste wedstrijd.
                    </p>
                  </Link>

                  <Link
                    href={`/pools/${pool.id}/leaderboard`}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-600 hover:bg-zinc-900"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      WK
                    </p>
                    <h2 className="mt-2 text-base font-semibold">Ranglijst</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Bekijk matchpunten, bonuspunten en totaal.
                    </p>
                  </Link>
                </>
              ) : pool.game_type === "office_bingo" ? (
                <>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <h2 className="text-base font-semibold">Bingo settings</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Hier komt straks de setup voor board size, items en rules.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 opacity-70">
                    <h2 className="text-base font-semibold">Kaarten</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Spelers krijgen later unieke bingo-kaarten binnen deze
                      pool.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 opacity-70">
                    <h2 className="text-base font-semibold">Claims</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Bingo claims en verificatie bouwen we later.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <h2 className="text-base font-semibold">Raceweekenden</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Hier komt straks de F1-structuur met weekends en sessies.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 opacity-70">
                    <h2 className="text-base font-semibold">Predictions</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      De F1 voorspellingen bouwen we later.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 opacity-70">
                    <h2 className="text-base font-semibold">Stand</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      De F1-ranglijst volgt later.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
              <h2 className="text-lg font-semibold sm:text-xl">Pool leden</h2>

              {typedMembers.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {typedMembers.map((member) => {
                    const displayName = getDisplayName(
                      member.user_id,
                      profilesMap,
                      user.id
                    );

                    return (
                      <div
                        key={member.user_id}
                        className={`rounded-xl border px-4 py-3 ${
                          member.user_id === user.id
                            ? "border-white bg-zinc-950"
                            : "border-zinc-800 bg-zinc-950/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {displayName}
                            </p>
                          </div>

                          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
                            {member.role}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">
                  Er zijn nog geen leden gevonden.
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
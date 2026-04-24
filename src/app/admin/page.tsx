import { redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase";
import { getPoolTypeMeta } from "@/lib/pool-types";

type PoolMembershipRow = {
  role: string;
  joined_at: string;
  pools:
    | {
        id: string;
        name: string;
        game_type: string;
        invite_code: string;
        created_at: string;
      }
    | {
        id: string;
        name: string;
        game_type: string;
        invite_code: string;
        created_at: string;
      }[]
    | null;
};

type AppPoolRow = {
  id: string;
  name: string;
  game_type: string;
  invite_code: string;
  created_at: string;
};

type PoolMemberCountRow = {
  pool_id: string;
};

type PredictionCountRow = {
  pool_id: string;
};

type BonusAnswerCountRow = {
  pool_id: string;
};

function getPoolTypeDisplay(poolType: string) {
  switch (poolType) {
    case "world_cup":
      return "WK Poule";
    case "office_bingo":
      return "Office Bingo";
    case "f1":
      return "F1 Poule";
    default:
      return poolType;
  }
}

function countByPoolId<T extends { pool_id: string }>(rows: T[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.pool_id, (counts.get(row.pool_id) ?? 0) + 1);
  }

  return counts;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: appAdmin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("pool_members")
    .select(
      "role, joined_at, pools(id, name, game_type, invite_code, created_at)"
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const displayName =
    profile?.display_name?.trim() || user.email || "Gebruiker";

  const myPools = ((memberships ?? []) as PoolMembershipRow[])
    .map((membership) => {
      const pool = Array.isArray(membership.pools)
        ? membership.pools[0]
        : membership.pools;

      if (!pool) {
        return null;
      }

      const typeMeta = getPoolTypeMeta(pool.game_type);

      return {
        id: pool.id,
        name: pool.name,
        gameType: pool.game_type,
        gameTypeLabel: typeMeta.label,
        gameTypeShortLabel: typeMeta.shortLabel,
        inviteCode: pool.invite_code,
        createdAt: pool.created_at,
        role: membership.role,
      };
    })
    .filter(Boolean) as {
    id: string;
    name: string;
    gameType: string;
    gameTypeLabel: string;
    gameTypeShortLabel: string;
    inviteCode: string;
    createdAt: string;
    role: string;
  }[];

  let appPools: AppPoolRow[] = [];
  let memberCounts = new Map<string, number>();
  let predictionCounts = new Map<string, number>();
  let bonusAnswerCounts = new Map<string, number>();

  if (appAdmin) {
    const { data: pools } = await supabase
      .from("pools")
      .select("id, name, game_type, invite_code, created_at")
      .order("created_at", { ascending: false });

    appPools = (pools ?? []) as AppPoolRow[];

    const appPoolIds = appPools.map((pool) => pool.id);

    if (appPoolIds.length > 0) {
      const { data: poolMembers } = await supabase
        .from("pool_members")
        .select("pool_id")
        .in("pool_id", appPoolIds);

      const { data: predictions } = await supabase
        .from("predictions")
        .select("pool_id")
        .in("pool_id", appPoolIds);

      const { data: bonusAnswers } = await supabase
        .from("bonus_question_answers")
        .select("pool_id")
        .in("pool_id", appPoolIds);

      memberCounts = countByPoolId((poolMembers ?? []) as PoolMemberCountRow[]);
      predictionCounts = countByPoolId(
        (predictions ?? []) as PredictionCountRow[]
      );
      bonusAnswerCounts = countByPoolId(
        (bonusAnswers ?? []) as BonusAnswerCountRow[]
      );
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-16">
        <Container>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                  Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Welkom, {displayName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  Hier zie je al je pools. Je kunt nu een nieuwe pool aanmaken
                  en daarbij direct het juiste pooltype kiezen.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/pools/new"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                >
                  Nieuwe pool
                </Link>

                <Link
                  href="/join"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Join pool
                </Link>

                <SignOutButton />
              </div>
            </div>

            {appAdmin ? (
              <>
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                        App admin tools
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Beheer hier de centrale WK-uitslagen, bonusvragen en de
                        officiële WK wedstrijdstructuur voor alle pools.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Link
                        href="/admin/world-cup/import"
                        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                      >
                        WK wedstrijden importeren
                      </Link>

                      <Link
                        href="/admin/world-cup/sync"
                        className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                      >
                        Knock-out sync
                      </Link>

                      <Link
                        href="/admin/world-cup/results"
                        className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                      >
                        WK resultaten beheren
                      </Link>

                      <Link
                        href="/admin/world-cup/bonus"
                        className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                      >
                        WK bonusvragen beheren
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                        Alle pools
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Overzicht van alle aangemaakte pools in de app. Testdata
                        acties zijn alleen beschikbaar voor WK-pools.
                      </p>
                    </div>

                    <p className="text-sm text-zinc-500">
                      {appPools.length} {appPools.length === 1 ? "pool" : "pools"}
                    </p>
                  </div>

                  {appPools.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6">
                      <h3 className="text-lg font-semibold">
                        Nog geen pools aangemaakt
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Zodra gebruikers pools maken, verschijnen ze hier.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-3">
                      {appPools.map((pool) => {
                        const isWorldCup = pool.game_type === "world_cup";

                        return (
                          <div
                            key={pool.id}
                            className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/pools/${pool.id}`}
                                    className="text-lg font-semibold text-white transition hover:text-zinc-300"
                                  >
                                    {pool.name}
                                  </Link>

                                  <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] uppercase tracking-wide text-zinc-300">
                                    {getPoolTypeDisplay(pool.game_type)}
                                  </span>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                                  <span>
                                    Invite:{" "}
                                    <span className="font-semibold text-zinc-300">
                                      {pool.invite_code}
                                    </span>
                                  </span>
                                  <span>·</span>
                                  <span>
                                    Leden: {memberCounts.get(pool.id) ?? 0}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    Predictions:{" "}
                                    {predictionCounts.get(pool.id) ?? 0}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    Bonus answers:{" "}
                                    {bonusAnswerCounts.get(pool.id) ?? 0}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                                <Link
                                  href={`/pools/${pool.id}`}
                                  className="rounded-xl border border-zinc-700 px-4 py-2 text-center text-xs font-semibold text-white transition hover:bg-zinc-800"
                                >
                                  Open pool
                                </Link>

                                {isWorldCup ? (
                                  <>
                                    <form
                                      method="post"
                                      action={`/api/pools/${pool.id}/fill-testdata`}
                                    >
                                      <button
                                        type="submit"
                                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                                      >
                                        Vul testdata
                                      </button>
                                    </form>

                                    <form
                                      method="post"
                                      action={`/api/pools/${pool.id}/reset-testdata`}
                                    >
                                      <button
                                        type="submit"
                                        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-500/50 hover:bg-red-500/15"
                                      >
                                        Reset testdata
                                      </button>
                                    </form>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : null}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Mijn pools
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Je bent momenteel lid van {myPools.length}{" "}
                    {myPools.length === 1 ? "pool" : "pools"}.
                  </p>
                </div>

                <div className="hidden gap-3 sm:flex">
                  <Link
                    href="/join"
                    className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Join via code
                  </Link>

                  <Link
                    href="/pools/new"
                    className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Pool aanmaken
                  </Link>
                </div>
              </div>

              {myPools.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6">
                  <h3 className="text-lg font-semibold">
                    Je hebt nog geen pools
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                    Maak je eerste pool aan en kies direct of het een WK Poule,
                    Office Bingo of F1 Poule moet worden.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/pools/new"
                      className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                    >
                      Eerste pool maken
                    </Link>

                    <Link
                      href="/join"
                      className="inline-flex rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Pool joinen
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {myPools.map((pool) => (
                    <Link
                      key={pool.id}
                      href={`/pools/${pool.id}`}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 transition hover:border-zinc-600 hover:bg-zinc-950"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-semibold">
                              {pool.name}
                            </h3>
                            <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
                              {pool.role}
                            </span>
                            <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
                              {pool.gameTypeShortLabel}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            Speltype: {pool.gameTypeLabel}
                          </p>
                        </div>

                        <div className="text-sm text-zinc-400">
                          Invite code:{" "}
                          <span className="font-semibold text-white">
                            {pool.inviteCode}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Link
                href="/"
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar home
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
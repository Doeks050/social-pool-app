import { redirect } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import SectionCard from "@/components/ui/SectionCard";
import AppButton from "@/components/ui/AppButton";
import SignOutButton from "@/components/SignOutButton";
import DeletePoolButton from "@/components/admin/DeletePoolButton";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
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
  plan_code: string | null;
  max_members: number | null;
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

function getPlanDisplay(planCode: string | null) {
  switch (planCode) {
    case "starter":
      return "Starter";
    case "small":
      return "Small";
    case "pro":
      return "Pro";
    case "business":
      return "Business";
    default:
      return "Starter";
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

      if (!pool) return null;

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
    const adminSupabase = createAdminClient();

    const { data: pools } = await adminSupabase
      .from("pools")
      .select(
        "id, name, game_type, invite_code, created_at, plan_code, max_members"
      )
      .order("created_at", { ascending: false });

    appPools = (pools ?? []) as AppPoolRow[];

    const appPoolIds = appPools.map((pool) => pool.id);

    if (appPoolIds.length > 0) {
      const { data: poolMembers } = await adminSupabase
        .from("pool_members")
        .select("pool_id")
        .in("pool_id", appPoolIds);

      const { data: predictions } = await adminSupabase
        .from("predictions")
        .select("pool_id")
        .in("pool_id", appPoolIds);

      const { data: bonusAnswers } = await adminSupabase
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
    <PageShell>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6">
        <SectionCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Welkom, {displayName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Hier zie je je pools, beheer je WK-tools en kun je nieuwe pools
                aanmaken of joinen.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <AppButton href="/pools/new" variant="primary">
                Nieuwe pool
              </AppButton>
              <AppButton href="/join">Join pool</AppButton>
              <SignOutButton />
            </div>
          </div>
        </SectionCard>

        {appAdmin ? (
          <>
            <SectionCard>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    App admin tools
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Centraal beheer voor WK-uitslagen, bonusvragen en
                    wedstrijdstructuur.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
                  <AppButton href="/admin/world-cup/import" variant="primary">
                    WK importeren
                  </AppButton>
                  <AppButton href="/admin/world-cup/sync">
                    Knock-out sync
                  </AppButton>
                  <AppButton href="/admin/world-cup/results">
                    WK resultaten
                  </AppButton>
                  <AppButton href="/admin/world-cup/bonus">
                    WK bonusvragen
                  </AppButton>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    Alle pools
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Overzicht van alle aangemaakte pools in de app.
                  </p>
                </div>

                <p className="text-sm text-zinc-500">
                  {appPools.length} {appPools.length === 1 ? "pool" : "pools"}
                </p>
              </div>

              {appPools.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 p-4 sm:p-6">
                  <h3 className="text-base font-semibold sm:text-lg">
                    Nog geen pools aangemaakt
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Zodra gebruikers pools maken, verschijnen ze hier.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {appPools.map((pool) => {
                    const isWorldCup = pool.game_type === "world_cup";
                    const memberCount = memberCounts.get(pool.id) ?? 0;
                    const maxMembers = pool.max_members ?? 10;

                    return (
                      <div
                        key={pool.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3 sm:p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/pools/${pool.id}`}
                                className="break-words text-base font-semibold text-white transition hover:text-zinc-300 sm:text-lg"
                              >
                                {pool.name}
                              </Link>

                              <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] uppercase tracking-wide text-zinc-300">
                                {getPoolTypeDisplay(pool.game_type)}
                              </span>

                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-emerald-200">
                                {getPlanDisplay(pool.plan_code)}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                              <span>
                                Invite:{" "}
                                <span className="font-semibold text-zinc-300">
                                  {pool.invite_code}
                                </span>
                              </span>
                              <span className="hidden sm:inline">·</span>
                              <span>
                                Pakket:{" "}
                                <span className="font-semibold text-zinc-300">
                                  {getPlanDisplay(pool.plan_code)}
                                </span>
                              </span>
                              <span className="hidden sm:inline">·</span>
                              <span>
                                Leden:{" "}
                                <span className="font-semibold text-zinc-300">
                                  {memberCount}/{maxMembers}
                                </span>
                              </span>
                              <span className="hidden sm:inline">·</span>
                              <span>
                                Predictions: {predictionCounts.get(pool.id) ?? 0}
                              </span>
                              <span className="hidden sm:inline">·</span>
                              <span>
                                Bonus answers:{" "}
                                {bonusAnswerCounts.get(pool.id) ?? 0}
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:shrink-0">
                            <AppButton
                              href={`/pools/${pool.id}`}
                              className="text-xs"
                            >
                              Open pool
                            </AppButton>

                            {isWorldCup ? (
                              <>
                                <form
                                  method="post"
                                  action={`/api/pools/${pool.id}/fill-testdata`}
                                >
                                  <button
                                    type="submit"
                                    className="min-h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
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
                                    className="min-h-10 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-500/50 hover:bg-red-500/15"
                                  >
                                    Reset testdata
                                  </button>
                                </form>
                              </>
                            ) : null}

                            <DeletePoolButton
                              poolId={pool.id}
                              poolName={pool.name}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </>
        ) : null}

        <SectionCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Mijn pools
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Je bent momenteel lid van {myPools.length}{" "}
                {myPools.length === 1 ? "pool" : "pools"}.
              </p>
            </div>

            <div className="grid gap-2 sm:flex">
              <AppButton href="/join">Join via code</AppButton>
              <AppButton href="/pools/new">Pool aanmaken</AppButton>
            </div>
          </div>

          {myPools.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 p-4 sm:p-6">
              <h3 className="text-base font-semibold sm:text-lg">
                Je hebt nog geen pools
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                Maak je eerste pool aan en kies direct of het een WK Poule,
                Office Bingo of F1 Poule moet worden.
              </p>

              <div className="mt-4 grid gap-2 sm:flex">
                <AppButton href="/pools/new" variant="primary">
                  Eerste pool maken
                </AppButton>
                <AppButton href="/join">Pool joinen</AppButton>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {myPools.map((pool) => (
                <Link
                  key={pool.id}
                  href={`/pools/${pool.id}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-zinc-600 hover:bg-zinc-950"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-lg font-semibold">
                          {pool.name}
                        </h3>
                        <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] uppercase tracking-wide text-zinc-300">
                          {pool.role}
                        </span>
                        <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] uppercase tracking-wide text-zinc-300">
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
        </SectionCard>

        <div>
          <Link
            href="/"
            className="inline-flex text-sm text-zinc-400 transition hover:text-white"
          >
            ← Terug naar home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
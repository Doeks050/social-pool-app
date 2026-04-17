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

function getRoleLabel(role: string) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    default:
      return "Lid";
  }
}

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

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
};

function ActionCard({ href, title, description }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-zinc-700 hover:bg-zinc-900 active:scale-[0.99]"
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
      </div>
    </Link>
  );
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
  const canManageTestData =
    membership.role === "owner" || membership.role === "admin";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-6 sm:py-8">
        <Container>
          <div
            className={`mx-auto flex flex-col gap-4 ${
              isWorldCup ? "max-w-3xl" : "max-w-4xl"
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

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                      {isWorldCup ? "WK Pool" : "Pool"}
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                      {pool.name}
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                      {getPoolTypeDisplay(pool.game_type)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-3 sm:min-w-[180px]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Invite code
                    </p>
                    <p className="mt-1 text-lg font-semibold tracking-wider text-white">
                      {pool.invite_code}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Rol
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {getRoleLabel(membership.role)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Leden
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {typedMembers.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Spel
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {poolType.shortLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Snelle acties</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Alles wat je nodig hebt voor deze pool.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {pool.game_type === "world_cup" ? (
                  <>
                    <ActionCard
                      href={`/pools/${pool.id}/matches`}
                      title="Wedstrijden"
                      description="Bekijk en vul je wedstrijdvoorspellingen in."
                    />

                    <ActionCard
                      href={`/pools/${pool.id}/bonus`}
                      title="Bonusvragen"
                      description="Vul je bonusvragen in vóór de eerste wedstrijd."
                    />

                    <ActionCard
                      href={`/pools/${pool.id}/standings`}
                      title="Groepenstand"
                      description="Bekijk de actuele stand per groep op basis van uitslagen."
                    />

                    <ActionCard
                      href={`/pools/${pool.id}/leaderboard`}
                      title="Ranglijst"
                      description="Bekijk matchpunten, bonuspunten en totaal."
                    />
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
            </div>

            {isWorldCup && canManageTestData ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white">Testdata</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Vul deze pool snel met voorbeeldvoorspellingen en
                    bonusantwoorden, of zet alles weer terug leeg.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <form method="post" action={`/api/pools/${id}/fill-testdata`}>
                    <button
                      type="submit"
                      className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-900"
                    >
                      Vul testdata
                    </button>
                  </form>

                  <form method="post" action={`/api/pools/${id}/reset-testdata`}>
                    <button
                      type="submit"
                      className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:border-red-500/50 hover:bg-red-500/15"
                    >
                      Reset testdata
                    </button>
                  </form>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Poolleden</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Wie zitten er in deze pool.
                  </p>
                </div>
                <div className="text-sm text-zinc-500">{typedMembers.length}</div>
              </div>

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
                        className={`rounded-2xl border px-4 py-3 ${
                          member.user_id === user.id
                            ? "border-white/80 bg-zinc-950"
                            : "border-zinc-800 bg-zinc-950/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-medium text-white">
                            {displayName}
                          </p>

                          <span className="shrink-0 rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] uppercase tracking-wide text-zinc-300">
                            {getRoleLabel(member.role)}
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
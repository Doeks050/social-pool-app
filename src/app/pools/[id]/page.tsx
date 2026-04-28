import Image from "next/image";
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
    return userId === currentUserId ? `${profileName} (you)` : profileName;
  }

  const fallback = `User ${userId.slice(0, 8)}`;
  return userId === currentUserId ? `${fallback} (you)` : fallback;
}

function getRoleLabel(role: string) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    default:
      return "Member";
  }
}

function getPoolTypeDisplay(poolType: string) {
  switch (poolType) {
    case "world_cup":
      return "World Cup Pool";
    case "office_bingo":
      return "Office Bingo";
    case "f1":
      return "F1 Pool";
    default:
      return poolType;
  }
}

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
  label?: string;
};

function ActionCard({ href, title, description, label }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 transition hover:border-emerald-300/35 hover:bg-emerald-300/[0.06] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {label ? (
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
              {label}
            </p>
          ) : null}
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-emerald-200 transition group-hover:border-emerald-300/30 group-hover:bg-emerald-300/10">
          →
        </div>
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
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,255,160,0.13),transparent_32%),radial-gradient(circle_at_85%_45%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,#04100c_0%,#030706_54%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-5 sm:py-6">
            <header className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={340}
                  height={100}
                  priority
                  className="h-[72px] w-auto sm:h-[88px] lg:h-24"
                />
              </Link>

              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Dashboard
              </Link>
            </header>

            <div
              className={`mx-auto mt-8 flex flex-col gap-5 ${isWorldCup ? "max-w-4xl" : "max-w-5xl"
                }`}
            >
              <Link
                href="/dashboard"
                className="inline-flex w-fit text-sm font-semibold text-zinc-400 transition hover:text-white"
              >
                ← Back to dashboard
              </Link>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                      {isWorldCup ? "World Cup Pool" : "Private Pool"}
                    </div>

                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                      {pool.name}
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-base">
                      {getPoolTypeDisplay(pool.game_type)}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 sm:min-w-[210px]">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                      Invite code
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-widest text-white">
                      {pool.invite_code}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                      Role
                    </p>
                    <p className="mt-2 text-lg font-black text-white">
                      {getRoleLabel(membership.role)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                      Members
                    </p>
                    <p className="mt-2 text-lg font-black text-white">
                      {typedMembers.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                      Game
                    </p>
                    <p className="mt-2 text-lg font-black text-white">
                      {poolType.shortLabel}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                    Quick actions
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    Everything for this pool
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Make predictions, check standings and follow the leaderboard.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {pool.game_type === "world_cup" ? (
                    <>
                      <ActionCard
                        href={`/pools/${pool.id}/matches`}
                        label="Predict"
                        title="Matches"
                        description="View fixtures and submit your match predictions."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}/bonus`}
                        label="Extra points"
                        title="Bonus questions"
                        description="Answer bonus questions before the first match starts."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}/standings`}
                        label="Groups"
                        title="Group standings"
                        description="Follow the current group tables based on official results."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}/leaderboard`}
                        label="Ranking"
                        title="Leaderboard"
                        description="Track match points, bonus points and total score."
                      />
                    </>
                  ) : pool.game_type === "office_bingo" ? (
                    <>
                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Setup"
                        title="Bingo settings"
                        description="Board size, items and rules will be managed here soon."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Cards"
                        title="Player cards"
                        description="Players will receive unique bingo cards inside this pool."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Claims"
                        title="Bingo claims"
                        description="Claim review and manual verification will be added later."
                      />
                    </>
                  ) : (
                    <>
                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Weekends"
                        title="Race weekends"
                        description="F1 weekends and sessions will be managed here soon."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Predict"
                        title="Predictions"
                        description="F1 prediction forms will be added later."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Ranking"
                        title="Standings"
                        description="The F1 leaderboard will follow later."
                      />
                    </>
                  )}
                </div>
              </section>

              {isWorldCup && canManageTestData ? (
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      Test tools
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight">
                      Fill or reset sample data
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Use this while testing your World Cup pool flow.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <form method="post" action={`/api/pools/${id}/fill-testdata`}>
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                      >
                        Fill test data
                      </button>
                    </form>

                    <form method="post" action={`/api/pools/${id}/reset-testdata`}>
                      <button
                        type="submit"
                        className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-200 transition hover:border-red-500/50 hover:bg-red-500/15"
                      >
                        Reset test data
                      </button>
                    </form>
                  </div>
                </section>
              ) : null}

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      Members
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight">
                      Pool members
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Everyone currently inside this pool.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-lg font-black">
                    {typedMembers.length}
                  </div>
                </div>

                {typedMembers.length > 0 ? (
                  <div className="mt-5 grid gap-2">
                    {typedMembers.map((member) => {
                      const displayName = getDisplayName(
                        member.user_id,
                        profilesMap,
                        user.id
                      );

                      return (
                        <div
                          key={member.user_id}
                          className={`rounded-2xl border px-4 py-3 ${member.user_id === user.id
                            ? "border-emerald-300/40 bg-emerald-300/10"
                            : "border-white/10 bg-black/20"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="min-w-0 truncate text-sm font-bold text-white">
                              {displayName}
                            </p>

                            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-300">
                              {getRoleLabel(member.role)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-400">
                    No members found yet.
                  </p>
                )}
              </section>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
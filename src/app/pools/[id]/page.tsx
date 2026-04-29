import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import { getPoolTypeMeta } from "@/lib/pool-types";
import NextMatchHighlight from "@/components/world-cup/NextMatchHighlight";

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

type NextMatchRow = {
  id: string;
  starts_at: string;
  stage: string | null;
  round_name: string | null;
  group_label: string | null;
  match_number: number | null;
  home_team: string | null;
  away_team: string | null;
  home_slot: string | null;
  away_slot: string | null;
};

function getDisplayName(userId: string, profilesMap: Map<string, string>) {
  const profileName = profilesMap.get(userId)?.trim();

  if (profileName) {
    return profileName;
  }

  return `User ${userId.slice(0, 8)}`;
}

function getInitials(name: string) {
  const cleanName = name.trim();

  if (!cleanName) {
    return "U";
  }

  const parts = cleanName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
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
  label: string;
  primary?: boolean;
};

function ActionCard({
  href,
  title,
  description,
  label,
  primary = false,
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[132px] flex-col items-center justify-center overflow-hidden rounded-2xl border p-4 text-center transition active:scale-[0.99] ${
        primary
          ? "border-emerald-300/35 bg-emerald-300/[0.10] hover:border-emerald-200/50 hover:bg-emerald-300/[0.14]"
          : "border-white/10 bg-black/20 hover:border-emerald-300/30 hover:bg-emerald-300/[0.05]"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px ${
          primary
            ? "bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
        }`}
      />

      <p
        className={`text-[10px] font-black uppercase tracking-[0.22em] ${
          primary ? "text-emerald-200" : "text-zinc-500"
        }`}
      >
        {label}
      </p>

      <h3 className="mt-2 text-lg font-black tracking-tight text-white">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-[220px] text-sm leading-5 text-zinc-400">
        {description}
      </p>
    </Link>
  );
}

type MemberCardProps = {
  member: PoolMemberRow;
  displayName: string;
  isCurrentUser: boolean;
};

function MemberCard({ member, displayName, isCurrentUser }: MemberCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 ${
        isCurrentUser
          ? "border-emerald-300/35 bg-emerald-300/[0.09]"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px ${
          isCurrentUser
            ? "bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
        }`}
      />

      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${
            isCurrentUser
              ? "border-emerald-200/30 bg-emerald-300/15 text-emerald-100"
              : "border-white/10 bg-white/[0.04] text-zinc-200"
          }`}
        >
          {getInitials(displayName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-black text-white">
              {displayName}
            </p>

            {isCurrentUser ? (
              <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200">
                You
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs font-semibold text-zinc-500">
            Joined {formatJoinedDate(member.joined_at)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
            member.role === "owner"
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
              : member.role === "admin"
              ? "border-sky-300/25 bg-sky-300/10 text-sky-200"
              : "border-white/10 bg-white/[0.04] text-zinc-400"
          }`}
        >
          {getRoleLabel(member.role)}
        </span>
      </div>
    </div>
  );
}

export default async function PoolDetailPage({ params }: PoolPageProps) {
  noStore();

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

  let nextMatch: NextMatchRow | null = null;

  if (isWorldCup) {
    const { data: nextMatchData } = await supabase
      .from("matches")
      .select(
        "id, starts_at, stage, round_name, group_label, match_number, home_team, away_team, home_slot, away_slot"
      )
      .eq("tournament", "world_cup_2026")
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .order("match_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    nextMatch = (nextMatchData ?? null) as NextMatchRow | null;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,255,160,0.13),transparent_34%),radial-gradient(circle_at_85%_38%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,#04100c_0%,#030706_52%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-4 sm:py-5">
            <header className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={340}
                  height={100}
                  priority
                  className="h-[52px] w-auto sm:h-[64px]"
                />
              </Link>

              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/90 backdrop-blur transition hover:bg-white/10 sm:text-sm"
              >
                Dashboard
              </Link>
            </header>

            <div className="mx-auto mt-4 flex max-w-6xl flex-col gap-4">
              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                        {getPoolTypeDisplay(pool.game_type)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                        {getRoleLabel(membership.role)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                        {typedMembers.length} members
                      </span>
                    </div>

                    <h1 className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {pool.name}
                    </h1>

                    <p className="mt-1 text-sm font-semibold text-zinc-400">
                      {poolType.shortLabel} pool dashboard
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 lg:min-w-[260px]">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                      Join code
                    </p>

                    <div className="mt-1 flex items-end justify-between gap-3">
                      <p className="text-2xl font-black tracking-widest text-white">
                        {pool.invite_code}
                      </p>

                      {isWorldCup ? (
                        <Link
                          href={`/pools/${pool.id}/matches`}
                          className="hidden rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-zinc-950 transition hover:bg-emerald-200 sm:inline-flex"
                        >
                          Predict
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              {isWorldCup ? (
                <NextMatchHighlight poolId={pool.id} match={nextMatch} />
              ) : null}

              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Pool menu
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-zinc-400">
                    Navigate to the main parts of this pool.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {pool.game_type === "world_cup" ? (
                    <>
                      <ActionCard
                        href={`/pools/${pool.id}/matches`}
                        label="Predict"
                        title="Matches"
                        description="Submit and review match predictions."
                        primary
                      />

                      <ActionCard
                        href={`/pools/${pool.id}/bonus`}
                        label="Bonus"
                        title="Questions"
                        description="Extra predictions for bonus points."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}/standings`}
                        label="Groups"
                        title="Standings"
                        description="View group tables and progress."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}/leaderboard`}
                        label="Ranking"
                        title="Leaderboard"
                        description="Follow the pool ranking."
                      />
                    </>
                  ) : pool.game_type === "office_bingo" ? (
                    <>
                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Setup"
                        title="Settings"
                        description="Manage board size and rules."
                        primary
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Cards"
                        title="Player cards"
                        description="View unique player bingo cards."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Claims"
                        title="Bingo claims"
                        description="Review submitted claims."
                      />
                    </>
                  ) : (
                    <>
                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Weekends"
                        title="Race weekends"
                        description="Manage F1 sessions."
                        primary
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Predict"
                        title="Predictions"
                        description="Open prediction forms."
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label="Ranking"
                        title="Standings"
                        description="View the leaderboard."
                      />
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Pool members
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-zinc-400">
                    {typedMembers.length}{" "}
                    {typedMembers.length === 1 ? "member" : "members"} in this
                    pool.
                  </p>
                </div>

                {typedMembers.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {typedMembers.map((member) => {
                      const displayName = getDisplayName(
                        member.user_id,
                        profilesMap
                      );

                      return (
                        <MemberCard
                          key={member.user_id}
                          member={member}
                          displayName={displayName}
                          isCurrentUser={member.user_id === user.id}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                    <p className="text-sm font-semibold text-zinc-400">
                      No members found yet.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
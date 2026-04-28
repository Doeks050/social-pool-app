import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

type LeaderboardPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PoolMemberRow = {
  user_id: string;
  role: string;
  joined_at: string;
};

type PredictionRow = {
  user_id: string;
  points_awarded: number | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
};

type BonusTemplateRow = {
  id: string;
  points_value: number;
  correct_answer: string | null;
};

type BonusAnswerRow = {
  user_id: string;
  question_id: string;
  answer_value: string;
};

type LeaderboardRow = {
  user_id: string;
  match_points: number;
  bonus_points: number;
  total_points: number;
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

function getRankClasses(index: number, isCurrentUser: boolean) {
  if (isCurrentUser) {
    return "border-emerald-300/45 bg-emerald-300/[0.09]";
  }

  if (index === 0) {
    return "border-yellow-300/30 bg-yellow-300/[0.07]";
  }

  return "border-white/10 bg-white/[0.04]";
}

function getRankBadgeClasses(index: number) {
  if (index === 0) {
    return "border-yellow-300/30 bg-yellow-300/15 text-yellow-100";
  }

  if (index === 1) {
    return "border-zinc-300/25 bg-zinc-300/10 text-zinc-100";
  }

  if (index === 2) {
    return "border-orange-300/25 bg-orange-300/10 text-orange-100";
  }

  return "border-white/10 bg-black/25 text-white";
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

  const { data: members } = await supabase
    .from("pool_members")
    .select("user_id, role, joined_at")
    .eq("pool_id", pool.id)
    .order("joined_at", { ascending: true });

  const typedMembers = (members ?? []) as PoolMemberRow[];

  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, points_awarded")
    .eq("pool_id", pool.id);

  const typedPredictions = (predictions ?? []) as PredictionRow[];

  const { data: bonusTemplates } = await supabase
    .from("bonus_question_templates")
    .select("id, points_value, correct_answer")
    .eq("game_type", "world_cup")
    .eq("is_active", true);

  const typedBonusTemplates = (bonusTemplates ?? []) as BonusTemplateRow[];

  const { data: bonusAnswers } = await supabase
    .from("bonus_question_answers")
    .select("user_id, question_id, answer_value")
    .eq("pool_id", pool.id);

  const typedBonusAnswers = (bonusAnswers ?? []) as BonusAnswerRow[];

  const memberJoinedAtMap = new Map(
    typedMembers.map((member) => [member.user_id, member.joined_at])
  );

  const matchPointsMap = new Map<string, number>();
  const bonusPointsMap = new Map<string, number>();

  for (const member of typedMembers) {
    matchPointsMap.set(member.user_id, 0);
    bonusPointsMap.set(member.user_id, 0);
  }

  for (const prediction of typedPredictions) {
    const current = matchPointsMap.get(prediction.user_id) ?? 0;
    matchPointsMap.set(
      prediction.user_id,
      current + (prediction.points_awarded ?? 0)
    );
  }

  const bonusTemplateMap = new Map(
    typedBonusTemplates.map((template) => [template.id, template])
  );

  for (const answer of typedBonusAnswers) {
    const template = bonusTemplateMap.get(answer.question_id);

    if (!template) {
      continue;
    }

    if (!template.correct_answer) {
      continue;
    }

    if (answer.answer_value !== template.correct_answer) {
      continue;
    }

    const current = bonusPointsMap.get(answer.user_id) ?? 0;
    bonusPointsMap.set(answer.user_id, current + template.points_value);
  }

  const leaderboard: LeaderboardRow[] = typedMembers
    .map((member) => {
      const matchPoints = matchPointsMap.get(member.user_id) ?? 0;
      const bonusPoints = bonusPointsMap.get(member.user_id) ?? 0;

      return {
        user_id: member.user_id,
        match_points: matchPoints,
        bonus_points: bonusPoints,
        total_points: matchPoints + bonusPoints,
      };
    })
    .sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }

      if (b.match_points !== a.match_points) {
        return b.match_points - a.match_points;
      }

      const aJoinedAt = memberJoinedAtMap.get(a.user_id) ?? "";
      const bJoinedAt = memberJoinedAtMap.get(b.user_id) ?? "";

      return new Date(aJoinedAt).getTime() - new Date(bJoinedAt).getTime();
    });

  const userIds = typedMembers.map((member) => member.user_id);

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

  const leader = leaderboard[0] ?? null;
  const currentUserRank =
    leaderboard.findIndex((entry) => entry.user_id === user.id) + 1;
  const currentUserScore =
    leaderboard.find((entry) => entry.user_id === user.id)?.total_points ?? 0;

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
                href={`/pools/${pool.id}`}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Pool
              </Link>
            </header>

            <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-5">
              <Link
                href={`/pools/${pool.id}`}
                className="inline-flex w-fit text-sm font-semibold text-zinc-400 transition hover:text-white"
              >
                ← Back to pool
              </Link>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      Leaderboard
                    </p>
                    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                      {pool.name}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                      Match points and bonus points are combined automatically
                      into the total ranking.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 sm:min-w-[190px]">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                      Your rank
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {currentUserRank > 0 ? `#${currentUserRank}` : "-"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {currentUserScore} pts
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Players
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {leaderboard.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Leader
                  </p>
                  <p className="mt-2 truncate text-lg font-black text-white">
                    {leader
                      ? getDisplayName(leader.user_id, profilesMap, user.id)
                      : "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Top score
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {leader ? leader.total_points : 0}
                  </p>
                </div>
              </div>

              {leaderboard.length > 0 ? (
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                        Ranking
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight">
                        Current standings
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {leaderboard.map((entry, index) => {
                      const displayName = getDisplayName(
                        entry.user_id,
                        profilesMap,
                        user.id
                      );
                      const isCurrentUser = entry.user_id === user.id;
                      const isLeader = index === 0;

                      return (
                        <div
                          key={entry.user_id}
                          className={`rounded-[1.5rem] border p-4 ${getRankClasses(
                            index,
                            isCurrentUser
                          )}`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${getRankBadgeClasses(
                                  index
                                )}`}
                              >
                                #{index + 1}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-white sm:text-base">
                                  {displayName}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {isLeader
                                    ? "Current leader"
                                    : isCurrentUser
                                      ? "Your position"
                                      : "Pool member"}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:min-w-[310px]">
                              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                                  Match
                                </p>
                                <p className="mt-1 text-base font-black text-white">
                                  {entry.match_points}
                                </p>
                              </div>

                              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                                  Bonus
                                </p>
                                <p className="mt-1 text-base font-black text-white">
                                  {entry.bonus_points}
                                </p>
                              </div>

                              <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-right">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-200">
                                  Total
                                </p>
                                <p className="mt-1 text-lg font-black text-white">
                                  {entry.total_points}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-6 backdrop-blur">
                  <h2 className="text-xl font-black">No players yet</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Once members join this pool, the leaderboard will appear
                    here.
                  </p>
                </section>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
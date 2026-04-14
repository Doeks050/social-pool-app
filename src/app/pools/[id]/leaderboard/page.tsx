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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-10 sm:py-12">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <div>
              <Link
                href={`/pools/${pool.id}`}
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar pool
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Ranglijst
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {pool.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Matchpunten en bonuspunten worden automatisch samengevoegd in
                deze stand.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Leden
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {leaderboard.length}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Leider
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {leader
                    ? getDisplayName(leader.user_id, profilesMap, user.id)
                    : "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Hoogste score
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {leader ? leader.total_points : 0}
                </p>
              </div>
            </div>

            {leaderboard.length > 0 ? (
              <div className="flex flex-col gap-3">
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
                      className={`rounded-2xl border p-4 ${
                        isCurrentUser
                          ? "border-white bg-zinc-950"
                          : "border-zinc-800 bg-zinc-900/60"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                              isLeader
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                                : "border-zinc-800 bg-zinc-950/70 text-white"
                            }`}
                          >
                            #{index + 1}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-white">
                              {displayName}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {isLeader ? "Huidige leider" : "Poollid"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:min-w-[290px]">
                          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-right">
                            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                              Match
                            </p>
                            <p className="mt-1 text-base font-semibold text-white">
                              {entry.match_points}
                            </p>
                          </div>

                          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-right">
                            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                              Bonus
                            </p>
                            <p className="mt-1 text-base font-semibold text-white">
                              {entry.bonus_points}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-right">
                            <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                              Totaal
                            </p>
                            <p className="mt-1 text-lg font-semibold text-white">
                              {entry.total_points}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5">
                <h2 className="text-lg font-semibold">Nog geen leden gevonden</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Zodra er leden in deze pool zitten, verschijnen ze hier.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
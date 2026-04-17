import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", _request.url));
  }

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.redirect(new URL(`/pools/${id}`, _request.url));
  }

  const canManage =
    membership.role === "owner" || membership.role === "admin";

  if (!canManage) {
    return NextResponse.redirect(new URL(`/pools/${id}`, _request.url));
  }

  const { data: pool } = await supabase
    .from("pools")
    .select("id, game_type")
    .eq("id", id)
    .maybeSingle();

  if (!pool || pool.game_type !== "world_cup") {
    return NextResponse.redirect(new URL(`/pools/${id}`, _request.url));
  }

  const { data: members } = await supabase
    .from("pool_members")
    .select("user_id")
    .eq("pool_id", id)
    .order("joined_at", { ascending: true });

  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team, away_team")
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true })
    .order("match_number", { ascending: true });

  const { data: bonusTemplates } = await supabase
    .from("bonus_question_templates")
    .select("id, options")
    .eq("game_type", "world_cup")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const membersForFill = (members ?? []) as Array<{ user_id: string }>;
  const matchesForFill = (matches ?? []) as Array<{
    id: string;
    home_team: string | null;
    away_team: string | null;
  }>;
  const bonusTemplatesForFill = (bonusTemplates ?? []) as Array<{
    id: string;
    options: string[] | null;
  }>;

  const playableMatches = matchesForFill.filter(
    (match) => match.home_team && match.away_team
  );

  const predictionPayload: Array<{
    pool_id: string;
    user_id: string;
    match_id: string;
    predicted_home_score: number;
    predicted_away_score: number;
  }> = [];

  for (let memberIndex = 0; memberIndex < membersForFill.length; memberIndex++) {
    const member = membersForFill[memberIndex];

    for (let matchIndex = 0; matchIndex < playableMatches.length; matchIndex++) {
      const match = playableMatches[matchIndex];

      const homeScore = (memberIndex + matchIndex) % 4;
      const awayScore = (memberIndex * 2 + matchIndex + 1) % 4;

      predictionPayload.push({
        pool_id: id,
        user_id: member.user_id,
        match_id: match.id,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
      });
    }
  }

  if (predictionPayload.length > 0) {
    await supabase.from("predictions").upsert(predictionPayload, {
      onConflict: "pool_id,user_id,match_id",
    });
  }

  const bonusPayload: Array<{
    pool_id: string;
    user_id: string;
    question_id: string;
    answer_value: string;
  }> = [];

  for (let memberIndex = 0; memberIndex < membersForFill.length; memberIndex++) {
    const member = membersForFill[memberIndex];

    for (
      let questionIndex = 0;
      questionIndex < bonusTemplatesForFill.length;
      questionIndex++
    ) {
      const question = bonusTemplatesForFill[questionIndex];
      const options = question.options ?? [];

      if (options.length === 0) {
        continue;
      }

      const selectedOption =
        options[(memberIndex + questionIndex) % options.length];

      bonusPayload.push({
        pool_id: id,
        user_id: member.user_id,
        question_id: question.id,
        answer_value: selectedOption,
      });
    }
  }

  if (bonusPayload.length > 0) {
    await supabase.from("bonus_question_answers").upsert(bonusPayload, {
      onConflict: "pool_id,user_id,question_id",
    });
  }

  revalidatePath(`/pools/${id}`);
  revalidatePath(`/pools/${id}/matches`);
  revalidatePath(`/pools/${id}/bonus`);
  revalidatePath(`/pools/${id}/leaderboard`);

  return NextResponse.redirect(new URL(`/pools/${id}`, _request.url), 303);
}
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function redirectTo(path: string, status = 303) {
  return new NextResponse(null, {
    status,
    headers: {
      Location: path,
    },
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("fill-testdata auth error:", userError);
    return new NextResponse("Auth error", { status: 500 });
  }

  if (!user) {
    return redirectTo("/auth");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("fill-testdata membership error:", membershipError);
    return new NextResponse("Membership lookup failed", { status: 500 });
  }

  if (!membership) {
    return redirectTo(`/pools/${id}`);
  }

  const canManage =
    membership.role === "owner" || membership.role === "admin";

  if (!canManage) {
    return redirectTo(`/pools/${id}`);
  }

  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("id, game_type")
    .eq("id", id)
    .maybeSingle();

  if (poolError) {
    console.error("fill-testdata pool error:", poolError);
    return new NextResponse("Pool lookup failed", { status: 500 });
  }

  if (!pool || pool.game_type !== "world_cup") {
    return redirectTo(`/pools/${id}`);
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, home_team, away_team")
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true })
    .order("match_number", { ascending: true });

  if (matchesError) {
    console.error("fill-testdata matches error:", matchesError);
    return new NextResponse("Matches lookup failed", { status: 500 });
  }

  const { data: bonusTemplates, error: bonusTemplatesError } = await supabase
    .from("bonus_question_templates")
    .select("id, options")
    .eq("game_type", "world_cup")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (bonusTemplatesError) {
    console.error("fill-testdata bonus templates error:", bonusTemplatesError);
    return new NextResponse("Bonus templates lookup failed", { status: 500 });
  }

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

  console.log("fill-testdata stats:", {
    poolId: id,
    currentUserId: user.id,
    matches: matchesForFill.length,
    playableMatches: playableMatches.length,
    bonusTemplates: bonusTemplatesForFill.length,
  });

  const predictionPayload: Array<{
    pool_id: string;
    user_id: string;
    match_id: string;
    predicted_home_score: number;
    predicted_away_score: number;
    points_awarded: number;
  }> = [];

  for (let matchIndex = 0; matchIndex < playableMatches.length; matchIndex++) {
    const match = playableMatches[matchIndex];

    const homeScore = matchIndex % 4;
    const awayScore = (matchIndex + 1) % 4;

    predictionPayload.push({
      pool_id: id,
      user_id: user.id,
      match_id: match.id,
      predicted_home_score: homeScore,
      predicted_away_score: awayScore,
      points_awarded: 0,
    });
  }

  if (predictionPayload.length > 0) {
    const { error: predictionsUpsertError } = await supabase
      .from("predictions")
      .upsert(predictionPayload, {
        onConflict: "pool_id,match_id,user_id",
      });

    if (predictionsUpsertError) {
      console.error(
        "fill-testdata predictions upsert error:",
        predictionsUpsertError
      );
      return new NextResponse(
        `Predictions upsert failed: ${predictionsUpsertError.message}`,
        { status: 500 }
      );
    }
  }

  const bonusPayload: Array<{
    pool_id: string;
    user_id: string;
    question_id: string;
    answer_value: string;
  }> = [];

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

    const selectedOption = options[questionIndex % options.length];

    bonusPayload.push({
      pool_id: id,
      user_id: user.id,
      question_id: question.id,
      answer_value: selectedOption,
    });
  }

  if (bonusPayload.length > 0) {
    const { error: bonusUpsertError } = await supabase
      .from("bonus_question_answers")
      .upsert(bonusPayload, {
        onConflict: "pool_id,user_id,question_id",
      });

    if (bonusUpsertError) {
      console.error("fill-testdata bonus upsert error:", bonusUpsertError);
      return new NextResponse(
        `Bonus answers upsert failed: ${bonusUpsertError.message}`,
        { status: 500 }
      );
    }
  }

  revalidatePath(`/pools/${id}`);
  revalidatePath(`/pools/${id}/matches`);
  revalidatePath(`/pools/${id}/bonus`);
  revalidatePath(`/pools/${id}/leaderboard`);

  return redirectTo(`/pools/${id}`);
}
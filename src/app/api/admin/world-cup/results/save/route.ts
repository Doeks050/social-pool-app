import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";
import { syncKnockoutTeams } from "@/lib/world-cup/syncKnockoutTeams";
import { getPredictionPoints } from "@/lib/world-cup-scoring";

type SaveResultPayload = {
  matchId?: string;
  homeScore?: number;
  awayScore?: number;
};

type PredictionRow = {
  id: string;
  pool_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
};

async function scorePredictionsForMatch(
  matchId: string,
  actualHomeScore: number,
  actualAwayScore: number
) {
  const supabase = await createClient();

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select("id, pool_id, predicted_home_score, predicted_away_score")
    .eq("match_id", matchId);

  if (predictionsError) {
    throw new Error(predictionsError.message);
  }

  const typedPredictions = (predictions ?? []) as PredictionRow[];

  for (const prediction of typedPredictions) {
    const points = getPredictionPoints(
      {
        home: prediction.predicted_home_score,
        away: prediction.predicted_away_score,
      },
      {
        home: actualHomeScore,
        away: actualAwayScore,
      }
    );

    const { error: updatePredictionError } = await supabase
      .from("predictions")
      .update({
        points_awarded: points,
      })
      .eq("id", prediction.id);

    if (updatePredictionError) {
      throw new Error(updatePredictionError.message);
    }
  }

  const uniquePoolIds = [
    ...new Set(typedPredictions.map((item) => item.pool_id)),
  ];

  for (const poolId of uniquePoolIds) {
    revalidatePath(`/pools/${poolId}`);
    revalidatePath(`/pools/${poolId}/matches`);
    revalidatePath(`/pools/${poolId}/leaderboard`);
    revalidatePath(`/pools/${poolId}/bracket`);
    revalidatePath(`/pools/${poolId}/bonus`);
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json(
      { error: `Auth error: ${userError.message}` },
      { status: 500 }
    );
  }

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { data: appAdmin, error: adminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return NextResponse.json(
      { error: `Admin check failed: ${adminError.message}` },
      { status: 500 }
    );
  }

  if (!appAdmin) {
    return NextResponse.json(
      { error: "Je bent geen app admin." },
      { status: 403 }
    );
  }

  let payload: SaveResultPayload;

  try {
    payload = (await request.json()) as SaveResultPayload;
  } catch {
    return NextResponse.json(
      { error: "Ongeldige request body." },
      { status: 400 }
    );
  }

  const matchId = String(payload.matchId ?? "").trim();
  const homeScore = Number(payload.homeScore);
  const awayScore = Number(payload.awayScore);

  if (!matchId) {
    return NextResponse.json(
      { error: "Geen wedstrijd id ontvangen." },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return NextResponse.json(
      { error: "Scores moeten gehele getallen van 0 of hoger zijn." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "finished",
    })
    .eq("id", matchId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  try {
    await scorePredictionsForMatch(matchId, homeScore, awayScore);
    await syncKnockoutTeams(supabase);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Onbekende fout tijdens score/sync verwerking.",
      },
      { status: 500 }
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/world-cup/results");
  revalidatePath("/admin/world-cup/sync");
  revalidatePath("/pools/[id]", "page");
  revalidatePath("/pools/[id]/matches", "page");
  revalidatePath("/pools/[id]/leaderboard", "page");
  revalidatePath("/pools/[id]/bracket", "page");
  revalidatePath("/pools/[id]/bonus", "page");

  return NextResponse.json({
    ok: true,
    message: "Resultaat opgeslagen en punten berekend.",
  });
}
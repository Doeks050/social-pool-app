import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type SavePredictionPayload = {
  matchId?: string;
  predictedHomeScore?: number;
  predictedAwayScore?: number;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

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

  const { data: membership, error: membershipError } = await supabase
    .from("pool_members")
    .select("id")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json(
      { error: `Membership check failed: ${membershipError.message}` },
      { status: 500 }
    );
  }

  if (!membership) {
    return NextResponse.json(
      { error: "Je bent geen lid van deze pool." },
      { status: 403 }
    );
  }

  let payload: SavePredictionPayload;

  try {
    payload = (await request.json()) as SavePredictionPayload;
  } catch {
    return NextResponse.json(
      { error: "Ongeldige request body." },
      { status: 400 }
    );
  }

  const matchId = String(payload.matchId ?? "").trim();
  const predictedHomeScore = Number(payload.predictedHomeScore);
  const predictedAwayScore = Number(payload.predictedAwayScore);

  if (!matchId) {
    return NextResponse.json(
      { error: "Geen wedstrijd id ontvangen." },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(predictedHomeScore) ||
    !Number.isInteger(predictedAwayScore) ||
    predictedHomeScore < 0 ||
    predictedAwayScore < 0
  ) {
    return NextResponse.json(
      { error: "Voorspellingen moeten gehele getallen van 0 of hoger zijn." },
      { status: 400 }
    );
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, starts_at, status")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) {
    return NextResponse.json(
      { error: `Wedstrijd ophalen mislukt: ${matchError.message}` },
      { status: 500 }
    );
  }

  if (!match) {
    return NextResponse.json(
      { error: "Wedstrijd niet gevonden." },
      { status: 404 }
    );
  }

  const isLocked =
    match.status === "finished" ||
    match.status === "live" ||
    match.status === "locked" ||
    new Date(match.starts_at).getTime() <= Date.now();

  if (isLocked) {
    return NextResponse.json(
      { error: "Deze wedstrijd is gelockt en kan niet meer voorspeld worden." },
      { status: 400 }
    );
  }

  const { error: upsertError } = await supabase.from("predictions").upsert(
    {
      pool_id: id,
      user_id: user.id,
      match_id: matchId,
      predicted_home_score: predictedHomeScore,
      predicted_away_score: predictedAwayScore,
      points_awarded: 0,
    },
    {
      onConflict: "pool_id,match_id,user_id",
    }
  );

  if (upsertError) {
    return NextResponse.json(
      { error: `Voorspelling opslaan mislukt: ${upsertError.message}` },
      { status: 500 }
    );
  }

  revalidatePath(`/pools/${id}`);
  revalidatePath(`/pools/${id}/matches`);
  revalidatePath(`/pools/${id}/leaderboard`);

  return NextResponse.json({
    ok: true,
    message: "Voorspelling opgeslagen.",
  });
}
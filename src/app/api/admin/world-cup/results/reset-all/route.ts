import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn." },
      { status: 401 }
    );
  }

  const { data: appAdmin, error: adminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return NextResponse.json(
      { error: adminError.message },
      { status: 500 }
    );
  }

  if (!appAdmin) {
    return NextResponse.json(
      { error: "Alleen app admins mogen alle uitslagen resetten." },
      { status: 403 }
    );
  }

  const { error: pointsError } = await supabase
    .from("prediction_scores")
    .delete()
    .eq("tournament", "world_cup_2026");

  if (pointsError) {
    return NextResponse.json(
      { error: pointsError.message },
      { status: 500 }
    );
  }

  const { error: matchesError } = await supabase
    .from("matches")
    .update({
      home_score: null,
      away_score: null,
      status: "upcoming",
    })
    .eq("tournament", "world_cup_2026");

  if (matchesError) {
    return NextResponse.json(
      { error: matchesError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Alle WK-uitslagen en punten zijn verwijderd.",
  });
}
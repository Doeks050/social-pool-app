import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import { syncKnockoutTeams } from "@/lib/world-cup/syncKnockoutTeams";
import { getPredictionPoints } from "@/lib/world-cup-scoring";

type SaveResultPayload = {
  matchId?: string;
  homeScore?: number;
  awayScore?: number;
  advancingTeam?: string;
};

type PredictionRow = {
  id: string;
  pool_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
};

type SourceMatchRow = {
  id: string;
  bracket_code: string | null;
  stage_type: string | null;
  is_knockout: boolean | null;
  home_team: string | null;
  away_team: string | null;
};

type DownstreamMatchRow = {
  id: string;
  home_slot: string | null;
  away_slot: string | null;
};

function normalizeSlotKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isKnockoutLike(match: SourceMatchRow) {
  return (
    (match.stage_type ?? "").toLowerCase() !== "group" ||
    match.is_knockout === true
  );
}

function cleanTeamName(value: string | null | undefined) {
  return value?.trim() ?? "";
}

async function scorePredictionsForMatch(
  matchId: string,
  actualHomeScore: number,
  actualAwayScore: number
) {
  const supabaseAdmin = createAdminClient();

  const { data: predictions, error: predictionsError } = await supabaseAdmin
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

    const { error: updatePredictionError } = await supabaseAdmin
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

async function getSourceMatch(supabase: any, matchId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("id, bracket_code, stage_type, is_knockout, home_team, away_team")
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Wedstrijd niet gevonden.");
  }

  return data as SourceMatchRow;
}

async function applyDrawAdvancementOverride(params: {
  supabase: any;
  sourceMatch: SourceMatchRow;
  advancingTeam: string;
}) {
  const { supabase, sourceMatch, advancingTeam } = params;

  const bracketCode = sourceMatch.bracket_code?.trim();

  if (!bracketCode) {
    throw new Error("Deze knock-outwedstrijd heeft geen bracket code.");
  }

  const homeTeam = cleanTeamName(sourceMatch.home_team);
  const awayTeam = cleanTeamName(sourceMatch.away_team);

  if (!homeTeam || !awayTeam) {
    throw new Error("Beide teams moeten bekend zijn om een doorganger te kiezen.");
  }

  if (advancingTeam !== homeTeam && advancingTeam !== awayTeam) {
    throw new Error("De gekozen doorganger hoort niet bij deze wedstrijd.");
  }

  const losingTeam = advancingTeam === homeTeam ? awayTeam : homeTeam;

  const winnerSlotKey = normalizeSlotKey(`winner_${bracketCode}`);
  const loserSlotKey = normalizeSlotKey(`loser_${bracketCode}`);

  const { data: downstreamMatches, error: downstreamError } = await supabase
    .from("matches")
    .select("id, home_slot, away_slot")
    .eq("tournament", "world_cup_2026");

  if (downstreamError) {
    throw new Error(downstreamError.message);
  }

  let updatedCount = 0;

  for (const downstreamMatch of (downstreamMatches ?? []) as DownstreamMatchRow[]) {
    const updatePayload: Record<string, string | boolean | null> = {};

    const homeSlotKey = downstreamMatch.home_slot
      ? normalizeSlotKey(downstreamMatch.home_slot)
      : null;

    const awaySlotKey = downstreamMatch.away_slot
      ? normalizeSlotKey(downstreamMatch.away_slot)
      : null;

    if (homeSlotKey === winnerSlotKey) {
      updatePayload.home_team = advancingTeam;
      updatePayload.home_team_locked_by_admin = true;
    }

    if (awaySlotKey === winnerSlotKey) {
      updatePayload.away_team = advancingTeam;
      updatePayload.away_team_locked_by_admin = true;
    }

    if (homeSlotKey === loserSlotKey) {
      updatePayload.home_team = losingTeam;
      updatePayload.home_team_locked_by_admin = true;
    }

    if (awaySlotKey === loserSlotKey) {
      updatePayload.away_team = losingTeam;
      updatePayload.away_team_locked_by_admin = true;
    }

    if (Object.keys(updatePayload).length === 0) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("matches")
      .update(updatePayload)
      .eq("id", downstreamMatch.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    updatedCount += 1;
  }

  return updatedCount;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

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

  const { data: appAdmin, error: adminError } = await supabaseAdmin
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
  const advancingTeam = String(payload.advancingTeam ?? "").trim();

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

  let sourceMatch: SourceMatchRow;

  try {
    sourceMatch = await getSourceMatch(supabaseAdmin, matchId);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wedstrijd ophalen mislukt.",
      },
      { status: 500 }
    );
  }

  const isKnockoutMatch = isKnockoutLike(sourceMatch);
  const isDraw = homeScore === awayScore;

  if (isKnockoutMatch && isDraw && !advancingTeam) {
    return NextResponse.json(
      {
        error:
          "Kies welk team doorgaat na verlenging/penalties. De score blijft de 90-minuten score.",
      },
      { status: 400 }
    );
  }

  if (isKnockoutMatch && isDraw) {
    const homeTeam = cleanTeamName(sourceMatch.home_team);
    const awayTeam = cleanTeamName(sourceMatch.away_team);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        {
          error:
            "Beide teams moeten bekend zijn voordat je een doorganger kunt kiezen.",
        },
        { status: 400 }
      );
    }

    if (advancingTeam !== homeTeam && advancingTeam !== awayTeam) {
      return NextResponse.json(
        { error: "De gekozen doorganger hoort niet bij deze wedstrijd." },
        { status: 400 }
      );
    }
  }

  const { error: updateError } = await supabaseAdmin
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

  let advancementUpdatedCount = 0;

  try {
    await scorePredictionsForMatch(matchId, homeScore, awayScore);

    if (isKnockoutMatch && isDraw) {
      advancementUpdatedCount = await applyDrawAdvancementOverride({
        supabase: supabaseAdmin,
        sourceMatch,
        advancingTeam,
      });
    }

    await syncKnockoutTeams(supabaseAdmin);
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
    message:
      isKnockoutMatch && isDraw
        ? advancementUpdatedCount > 0
          ? "Resultaat opgeslagen, punten berekend en doorganger verwerkt."
          : "Resultaat opgeslagen en punten berekend. Geen volgende knock-outslot gevonden."
        : "Resultaat opgeslagen en punten berekend.",
  });
}
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";
import { syncKnockoutTeams } from "@/lib/world-cup/syncKnockoutTeams";

type ResetResultPayload = {
    matchId?: string;
};

type PredictionPoolRow = {
    pool_id: string;
};

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

    let payload: ResetResultPayload;

    try {
        payload = (await request.json()) as ResetResultPayload;
    } catch {
        return NextResponse.json(
            { error: "Ongeldige request body." },
            { status: 400 }
        );
    }

    const matchId = String(payload.matchId ?? "").trim();

    if (!matchId) {
        return NextResponse.json(
            { error: "Geen wedstrijd id ontvangen." },
            { status: 400 }
        );
    }

    const { data: predictionPools, error: predictionPoolsError } = await supabase
        .from("predictions")
        .select("pool_id")
        .eq("match_id", matchId);

    if (predictionPoolsError) {
        return NextResponse.json(
            { error: `Predictions ophalen mislukt: ${predictionPoolsError.message}` },
            { status: 500 }
        );
    }

    const { error: resetPredictionError } = await supabase
        .from("predictions")
        .update({
            points_awarded: 0,
        })
        .eq("match_id", matchId);

    if (resetPredictionError) {
        return NextResponse.json(
            { error: `Punten resetten mislukt: ${resetPredictionError.message}` },
            { status: 500 }
        );
    }

    const { error: resetMatchError } = await supabase
        .from("matches")
        .update({
            home_score: null,
            away_score: null,
            status: "upcoming",
        })
        .eq("id", matchId);

    if (resetMatchError) {
        return NextResponse.json(
            { error: `Wedstrijd resetten mislukt: ${resetMatchError.message}` },
            { status: 500 }
        );
    }

    try {
        await syncKnockoutTeams(supabase);
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Onbekende fout tijdens knock-out sync.",
            },
            { status: 500 }
        );
    }

    const uniquePoolIds = [
        ...new Set(
            ((predictionPools ?? []) as PredictionPoolRow[]).map((row) => row.pool_id)
        ),
    ];

    for (const poolId of uniquePoolIds) {
        revalidatePath(`/pools/${poolId}`);
        revalidatePath(`/pools/${poolId}/matches`);
        revalidatePath(`/pools/${poolId}/leaderboard`);
        revalidatePath(`/pools/${poolId}/bracket`);
        revalidatePath(`/pools/${poolId}/bonus`);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/world-cup/results");
    revalidatePath("/admin/world-cup/sync");

    return NextResponse.json({
        ok: true,
        message: "Uitslag en punten zijn gereset.",
    });
}
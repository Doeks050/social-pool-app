import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";
import { syncKnockoutTeams } from "@/lib/world-cup/syncKnockoutTeams";

type ResetOverridePayload = {
  matchId?: string;
  side?: "home" | "away";
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

  let payload: ResetOverridePayload;

  try {
    payload = (await request.json()) as ResetOverridePayload;
  } catch {
    return NextResponse.json(
      { error: "Ongeldige request body." },
      { status: 400 }
    );
  }

  const matchId = String(payload.matchId ?? "").trim();
  const side = payload.side;

  if (!matchId || (side !== "home" && side !== "away")) {
    return NextResponse.json(
      { error: "Ongeldige reset invoer." },
      { status: 400 }
    );
  }

  const updatePayload =
    side === "home"
      ? {
          home_team_locked_by_admin: false,
        }
      : {
          away_team_locked_by_admin: false,
        };

  const { error: unlockError } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", matchId);

  if (unlockError) {
    return NextResponse.json(
      { error: unlockError.message },
      { status: 500 }
    );
  }

  try {
    await syncKnockoutTeams(supabase);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Onbekende sync fout.",
      },
      { status: 500 }
    );
  }

  revalidatePath("/admin/world-cup/results");
  revalidatePath("/pools/[id]/matches", "page");
  revalidatePath("/pools/[id]/bracket", "page");

  return NextResponse.json({
    ok: true,
    message:
      side === "home"
        ? "Home team reset naar auto-sync."
        : "Away team reset naar auto-sync.",
  });
}
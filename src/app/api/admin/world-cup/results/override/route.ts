import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

type OverridePayload = {
  matchId?: string;
  side?: "home" | "away";
  teamName?: string;
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

  let payload: OverridePayload;

  try {
    payload = (await request.json()) as OverridePayload;
  } catch {
    return NextResponse.json(
      { error: "Ongeldige request body." },
      { status: 400 }
    );
  }

  const matchId = String(payload.matchId ?? "").trim();
  const side = payload.side;
  const teamName = String(payload.teamName ?? "").trim();

  if (!matchId || (side !== "home" && side !== "away")) {
    return NextResponse.json(
      { error: "Ongeldige override invoer." },
      { status: 400 }
    );
  }

  const updatePayload =
    side === "home"
      ? {
          home_team: teamName || null,
          home_team_locked_by_admin: true,
        }
      : {
          away_team: teamName || null,
          away_team_locked_by_admin: true,
        };

  const { error: updateError } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", matchId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
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
        ? "Home team handmatig opgeslagen."
        : "Away team handmatig opgeslagen.",
  });
}
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

type ImportMatchRow = {
  bracket_code: string;
  match_number?: number | null;
  stage?: string | null;
  round_name?: string | null;
  stage_type:
    | "group"
    | "round_of_32"
    | "round_of_16"
    | "quarterfinal"
    | "semifinal"
    | "third_place"
    | "final";
  group_label?: string | null;
  round_order: number;
  starts_at: string;
  home_team?: string | null;
  away_team?: string | null;
  home_slot?: string | null;
  away_slot?: string | null;
  is_knockout?: boolean;
};

function redirectWithParams(request: Request, params: Record<string, string>) {
  const url = new URL("/admin/world-cup/import", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function fallbackTeamName(team: string | null, slot: string | null, bracketCode: string, side: "home" | "away") {
  if (team) return team;
  if (slot) return slot;
  return `${bracketCode.toUpperCase()} ${side.toUpperCase()}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawJson = formData.get("matches_json");

  if (typeof rawJson !== "string" || !rawJson.trim()) {
    return redirectWithParams(request, { error: "missing_json" });
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return redirectWithParams(request, { error: "invalid_json" });
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return redirectWithParams(request, { error: "empty_array" });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const { data: appAdmin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!appAdmin) {
    return redirectWithParams(request, { error: "forbidden" });
  }

  const sourceRows = parsed as ImportMatchRow[];

  const rows = sourceRows.map((row) => {
    const bracketCode = normalizeText(row.bracket_code);
    const homeTeam = normalizeText(row.home_team);
    const awayTeam = normalizeText(row.away_team);
    const homeSlot = normalizeText(row.home_slot);
    const awaySlot = normalizeText(row.away_slot);

    return {
      tournament: "world_cup_2026",
      bracket_code: bracketCode,
      match_number: row.match_number ?? null,
      stage: normalizeText(row.stage),
      round_name: normalizeText(row.round_name),
      stage_type: row.stage_type,
      group_label: normalizeText(row.group_label),
      round_order: row.round_order,
      starts_at: row.starts_at,
      home_team: fallbackTeamName(homeTeam, homeSlot, bracketCode ?? "match", "home"),
      away_team: fallbackTeamName(awayTeam, awaySlot, bracketCode ?? "match", "away"),
      home_slot: homeSlot,
      away_slot: awaySlot,
      is_knockout:
        typeof row.is_knockout === "boolean"
          ? row.is_knockout
          : row.stage_type !== "group",
      status: "upcoming",
      home_score: null,
      away_score: null,
    };
  });

  const invalidRow = rows.find(
    (row) =>
      !row.bracket_code ||
      !row.stage_type ||
      row.round_order === null ||
      row.round_order === undefined ||
      !row.starts_at ||
      !row.home_team ||
      !row.away_team
  );

  if (invalidRow) {
    return redirectWithParams(request, { error: "missing_required_fields" });
  }

  const { error } = await supabase.from("matches").upsert(rows, {
    onConflict: "tournament,bracket_code",
  });

  if (error) {
    return redirectWithParams(request, {
      error: error.message,
    });
  }

  return redirectWithParams(request, {
    success: String(rows.length),
  });
}
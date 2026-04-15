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

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url);
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
    return NextResponse.redirect(new URL("/admin/world-cup/import?error=forbidden", request.url));
  }

  const rows = (parsed as ImportMatchRow[]).map((row) => ({
    tournament: "world_cup_2026",
    bracket_code: row.bracket_code,
    match_number: row.match_number ?? null,
    stage: row.stage ?? null,
    round_name: row.round_name ?? null,
    stage_type: row.stage_type,
    group_label: row.group_label ?? null,
    round_order: row.round_order,
    starts_at: row.starts_at,
    home_team: row.home_team ?? null,
    away_team: row.away_team ?? null,
    home_slot: row.home_slot ?? null,
    away_slot: row.away_slot ?? null,
    is_knockout:
      typeof row.is_knockout === "boolean"
        ? row.is_knockout
        : row.stage_type !== "group",
    status: "scheduled",
    home_score: null,
    away_score: null,
  }));

  const invalidRow = rows.find(
    (row) =>
      !row.bracket_code ||
      !row.stage_type ||
      !row.round_order ||
      !row.starts_at
  );

  if (invalidRow) {
    return redirectWithParams(request, { error: "missing_required_fields" });
  }

  const { error } = await supabase.from("matches").upsert(rows, {
    onConflict: "tournament,bracket_code",
  });

  if (error) {
    return redirectWithParams(request, {
      error: encodeURIComponent(error.message),
    });
  }

  return redirectWithParams(request, {
    success: String(rows.length),
  });
}
import {
  buildSlotResolverContext,
  resolveSlotTeam,
  type WorldCupMatchRow,
} from "@/lib/world-cup/slotResolver";

type SyncResult = {
  updatedCount: number;
  skippedCount: number;
  passes: number;
};

async function fetchWorldCupMatches(supabase: any): Promise<WorldCupMatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, stage, round_name, stage_type, group_label, round_order, bracket_code, starts_at, status, home_team, away_team, home_slot, away_slot, home_score, away_score, is_knockout"
    )
    .eq("tournament", "world_cup_2026")
    .order("round_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WorldCupMatchRow[];
}

export async function syncKnockoutTeams(supabase: any): Promise<SyncResult> {
  let updatedCount = 0;
  let skippedCount = 0;
  let passes = 0;

  for (let pass = 0; pass < 8; pass += 1) {
    passes += 1;

    const matches = await fetchWorldCupMatches(supabase);
    const context = buildSlotResolverContext(matches);

    const knockoutMatches = matches.filter(
      (match) =>
        match.stage_type !== "group" ||
        match.is_knockout === true ||
        !!match.home_slot ||
        !!match.away_slot
    );

    let changedThisPass = 0;
    let skippedThisPass = 0;

    for (const match of knockoutMatches) {
      const resolvedHomeTeam = resolveSlotTeam(match.home_slot, context);
      const resolvedAwayTeam = resolveSlotTeam(match.away_slot, context);

      const nextHomeTeam = resolvedHomeTeam ?? match.home_team ?? null;
      const nextAwayTeam = resolvedAwayTeam ?? match.away_team ?? null;

      const changed =
        nextHomeTeam !== (match.home_team ?? null) ||
        nextAwayTeam !== (match.away_team ?? null);

      if (!changed) {
        skippedThisPass += 1;
        continue;
      }

      const { error } = await supabase
        .from("matches")
        .update({
          home_team: nextHomeTeam,
          away_team: nextAwayTeam,
        })
        .eq("id", match.id);

      if (error) {
        throw new Error(error.message);
      }

      changedThisPass += 1;
    }

    updatedCount += changedThisPass;
    skippedCount += skippedThisPass;

    if (changedThisPass === 0) {
      break;
    }
  }

  return {
    updatedCount,
    skippedCount,
    passes,
  };
}
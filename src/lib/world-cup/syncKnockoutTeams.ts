import {
  buildSlotResolverContext,
  resolveSlotTeam,
  type WorldCupMatchRow,
} from "@/lib/world-cup/slotResolver";

type SyncableWorldCupMatchRow = WorldCupMatchRow & {
  home_team_locked_by_admin: boolean;
  away_team_locked_by_admin: boolean;
};

type SyncResult = {
  updatedCount: number;
  skippedCount: number;
  passes: number;
};

async function fetchWorldCupMatches(
  supabase: any
): Promise<SyncableWorldCupMatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, stage, round_name, stage_type, group_label, round_order, bracket_code, starts_at, status, home_team, away_team, home_slot, away_slot, home_score, away_score, is_knockout, home_team_locked_by_admin, away_team_locked_by_admin"
    )
    .eq("tournament", "world_cup_2026")
    .order("round_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SyncableWorldCupMatchRow[];
}

function getNextTeamValue(params: {
  currentTeam: string | null;
  slot: string | null;
  resolvedTeam: string | null;
  lockedByAdmin: boolean;
}): string | null {
  const { currentTeam, slot, resolvedTeam, lockedByAdmin } = params;

  if (lockedByAdmin) {
    return currentTeam ?? null;
  }

  if (slot && slot.trim()) {
    return resolvedTeam ?? null;
  }

  return currentTeam ?? null;
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

      const nextHomeTeam = getNextTeamValue({
        currentTeam: match.home_team ?? null,
        slot: match.home_slot ?? null,
        resolvedTeam: resolvedHomeTeam,
        lockedByAdmin: match.home_team_locked_by_admin,
      });

      const nextAwayTeam = getNextTeamValue({
        currentTeam: match.away_team ?? null,
        slot: match.away_slot ?? null,
        resolvedTeam: resolvedAwayTeam,
        lockedByAdmin: match.away_team_locked_by_admin,
      });

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
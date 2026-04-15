import {
  buildGroupLookup,
  buildGroupStandings,
  type TeamStanding,
} from "@/lib/world-cup/groupStandings";

export type WorldCupMatchRow = {
  id: string;
  stage: string | null;
  round_name: string | null;
  stage_type: string | null;
  group_label: string | null;
  round_order: number | null;
  bracket_code: string | null;
  starts_at: string;
  status: string;
  home_team: string | null;
  away_team: string | null;
  home_slot: string | null;
  away_slot: string | null;
  home_score: number | null;
  away_score: number | null;
  is_knockout: boolean | null;
};

export type SlotResolverContext = {
  groupLookup: Map<string, TeamStanding[]>;
  matchesByCode: Map<string, WorldCupMatchRow>;
};

function normalizeBracketCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildSlotResolverContext(
  matches: WorldCupMatchRow[]
): SlotResolverContext {
  const groupStandings = buildGroupStandings(matches);
  const groupLookup = buildGroupLookup(groupStandings);

  const matchesByCode = new Map<string, WorldCupMatchRow>();

  for (const match of matches) {
    if (!match.bracket_code) {
      continue;
    }

    matchesByCode.set(normalizeBracketCode(match.bracket_code), match);
  }

  return {
    groupLookup,
    matchesByCode,
  };
}

function prettifySlot(slot: string): string {
  return slot
    .replace(/_/g, " ")
    .replace(/\bgroup\b/gi, "Group")
    .replace(/\bwinner\b/gi, "Winner")
    .replace(/\brunnerup\b/gi, "Runner-up")
    .replace(/\bloser\b/gi, "Loser")
    .replace(/\bround\b/gi, "Round")
    .replace(/\bof\b/gi, "of")
    .replace(/\bquarterfinal\b/gi, "Quarterfinal")
    .replace(/\bsemifinal\b/gi, "Semifinal")
    .replace(/\bfinal\b/gi, "Final");
}

function resolveMatchSideTeam(
  match: WorldCupMatchRow,
  side: "home" | "away",
  context: SlotResolverContext,
  visited: Set<string>
): string | null {
  const directTeam = side === "home" ? match.home_team : match.away_team;
  const slot = side === "home" ? match.home_slot : match.away_slot;

  if (directTeam && directTeam.trim()) {
    return directTeam;
  }

  return resolveSlotTeam(slot, context, visited);
}

export function resolveSlotTeam(
  slot: string | null | undefined,
  context: SlotResolverContext,
  visited: Set<string> = new Set()
): string | null {
  if (!slot) {
    return null;
  }

  const normalized = slot.trim().toLowerCase();
  const visitKey = `slot:${normalized}`;

  if (visited.has(visitKey)) {
    return null;
  }

  visited.add(visitKey);

  const winnerGroupMatch = normalized.match(/^winner_group_([a-z0-9]+)$/i);
  if (winnerGroupMatch) {
    const groupLabel = `Group ${winnerGroupMatch[1].toUpperCase()}`;
    const teams = context.groupLookup.get(groupLabel);
    visited.delete(visitKey);
    return teams?.[0]?.team ?? null;
  }

  const runnerUpGroupMatch = normalized.match(/^runnerup_group_([a-z0-9]+)$/i);
  if (runnerUpGroupMatch) {
    const groupLabel = `Group ${runnerUpGroupMatch[1].toUpperCase()}`;
    const teams = context.groupLookup.get(groupLabel);
    visited.delete(visitKey);
    return teams?.[1]?.team ?? null;
  }

  const winnerMatch = normalized.match(/^winner_(.+)$/i);
  if (winnerMatch) {
    const code = normalizeBracketCode(winnerMatch[1]);
    const sourceMatch = context.matchesByCode.get(code);

    if (!sourceMatch) {
      visited.delete(visitKey);
      return null;
    }

    const homeTeam: string | null = resolveMatchSideTeam(
      sourceMatch,
      "home",
      context,
      visited
    );
    const awayTeam: string | null = resolveMatchSideTeam(
      sourceMatch,
      "away",
      context,
      visited
    );

    const isFinished =
      sourceMatch.status === "finished" &&
      sourceMatch.home_score !== null &&
      sourceMatch.away_score !== null &&
      !!homeTeam &&
      !!awayTeam &&
      sourceMatch.home_score !== sourceMatch.away_score;

    visited.delete(visitKey);

    if (!isFinished) {
      return null;
    }

    return sourceMatch.home_score! > sourceMatch.away_score!
      ? homeTeam
      : awayTeam;
  }

  const loserMatch = normalized.match(/^loser_(.+)$/i);
  if (loserMatch) {
    const code = normalizeBracketCode(loserMatch[1]);
    const sourceMatch = context.matchesByCode.get(code);

    if (!sourceMatch) {
      visited.delete(visitKey);
      return null;
    }

    const homeTeam: string | null = resolveMatchSideTeam(
      sourceMatch,
      "home",
      context,
      visited
    );
    const awayTeam: string | null = resolveMatchSideTeam(
      sourceMatch,
      "away",
      context,
      visited
    );

    const isFinished =
      sourceMatch.status === "finished" &&
      sourceMatch.home_score !== null &&
      sourceMatch.away_score !== null &&
      !!homeTeam &&
      !!awayTeam &&
      sourceMatch.home_score !== sourceMatch.away_score;

    visited.delete(visitKey);

    if (!isFinished) {
      return null;
    }

    return sourceMatch.home_score! < sourceMatch.away_score!
      ? homeTeam
      : awayTeam;
  }

  visited.delete(visitKey);
  return null;
}

export function resolveSlotLabel(
  slot: string | null | undefined,
  context: SlotResolverContext
): string | null {
  if (!slot) {
    return null;
  }

  const resolvedTeam = resolveSlotTeam(slot, context);

  if (resolvedTeam) {
    return resolvedTeam;
  }

  return prettifySlot(slot);
}
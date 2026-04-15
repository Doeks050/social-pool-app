import type { WorldCupMatchRow } from "@/lib/world-cup/slotResolver";

export type TeamStanding = {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type GroupStanding = {
  groupKey: string;
  teams: TeamStanding[];
};

function normalizeGroupLabel(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const value = raw.trim();

  if (!value) {
    return null;
  }

  const match =
    value.match(/^group\s+([a-z0-9]+)$/i) ||
    value.match(/^groep\s+([a-z0-9]+)$/i) ||
    value.match(/group\s+([a-z0-9]+)/i) ||
    value.match(/groep\s+([a-z0-9]+)/i);

  if (!match) {
    return null;
  }

  return `Group ${match[1].toUpperCase()}`;
}

function inferGroupLabel(match: WorldCupMatchRow): string | null {
  return (
    normalizeGroupLabel(match.group_label) ||
    normalizeGroupLabel(match.round_name) ||
    normalizeGroupLabel(match.stage)
  );
}

function ensureTeam(
  table: Map<string, TeamStanding>,
  team: string
): TeamStanding {
  const existing = table.get(team);

  if (existing) {
    return existing;
  }

  const created: TeamStanding = {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };

  table.set(team, created);
  return created;
}

function applyMatchToTable(
  table: Map<string, TeamStanding>,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): void {
  const home = ensureTeam(table, homeTeam);
  const away = ensureTeam(table, awayTeam);

  home.played += 1;
  away.played += 1;

  home.goalsFor += homeScore;
  home.goalsAgainst += awayScore;
  away.goalsFor += awayScore;
  away.goalsAgainst += homeScore;

  if (homeScore > awayScore) {
    home.wins += 1;
    home.points += 3;
    away.losses += 1;
  } else if (awayScore > homeScore) {
    away.wins += 1;
    away.points += 3;
    home.losses += 1;
  } else {
    home.draws += 1;
    away.draws += 1;
    home.points += 1;
    away.points += 1;
  }

  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;
}

export function buildGroupStandings(matches: WorldCupMatchRow[]): GroupStanding[] {
  const groups = new Map<string, Map<string, TeamStanding>>();

  for (const match of matches) {
    const isGroupMatch = (match.stage_type ?? "").toLowerCase() === "group";
    if (!isGroupMatch) {
      continue;
    }

    const groupLabel = inferGroupLabel(match);

    if (!groupLabel) {
      continue;
    }

    if (!groups.has(groupLabel)) {
      groups.set(groupLabel, new Map<string, TeamStanding>());
    }

    const table = groups.get(groupLabel)!;

    if (match.home_team) {
      ensureTeam(table, match.home_team);
    }

    if (match.away_team) {
      ensureTeam(table, match.away_team);
    }

    const isFinished =
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null &&
      !!match.home_team &&
      !!match.away_team;

    if (isFinished) {
      applyMatchToTable(
        table,
        match.home_team!,
        match.away_team!,
        match.home_score!,
        match.away_score!
      );
    }
  }

  return Array.from(groups.entries())
    .map(([groupKey, teamMap]) => ({
      groupKey,
      teams: Array.from(teamMap.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) {
          return b.goalDifference - a.goalDifference;
        }
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.team.localeCompare(b.team);
      }),
    }))
    .sort((a, b) => a.groupKey.localeCompare(b.groupKey));
}

export function buildGroupLookup(
  standings: GroupStanding[]
): Map<string, TeamStanding[]> {
  const lookup = new Map<string, TeamStanding[]>();

  for (const group of standings) {
    lookup.set(group.groupKey, group.teams);
  }

  return lookup;
}
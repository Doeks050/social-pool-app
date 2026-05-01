import type { TeamStanding } from "@/lib/world-cup/groupStandings";

export type ThirdPlacedTeam = TeamStanding & {
  groupLabel: string;
  groupCode: string;
  thirdPlaceRank: number;
};

const ADVANCING_THIRD_PLACED_TEAMS = 8;

function getGroupCode(groupLabel: string): string | null {
  const match = groupLabel.trim().match(/^group\s+([a-z0-9]+)$/i);

  if (!match) {
    return null;
  }

  return match[1].toUpperCase();
}

export function isGroupComplete(
  teams: TeamStanding[] | null | undefined
): boolean {
  if (!teams || teams.length < 4) {
    return false;
  }

  return teams.every((team) => team.played >= 3);
}

function compareStandings(a: TeamStanding, b: TeamStanding): number {
  if (b.points !== a.points) return b.points - a.points;

  if (b.goalDifference !== a.goalDifference) {
    return b.goalDifference - a.goalDifference;
  }

  if (b.goalsFor !== a.goalsFor) {
    return b.goalsFor - a.goalsFor;
  }

  return a.team.localeCompare(b.team);
}

function normalizeSlot(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function extractCandidatePart(slot: string): string | null {
  const normalized = normalizeSlot(slot);

  const patterns = [
    /^best_third_place_group_(.+)$/i,
    /^best_third_place_groups_(.+)$/i,
    /^best_third_placed_group_(.+)$/i,
    /^best_third_placed_groups_(.+)$/i,
    /^best_third_group_(.+)$/i,
    /^best_third_groups_(.+)$/i,
    /^third_place_group_(.+)$/i,
    /^third_place_groups_(.+)$/i,
    /^third_placed_group_(.+)$/i,
    /^third_placed_groups_(.+)$/i,
    /^third_group_(.+)$/i,
    /^third_groups_(.+)$/i,
    /^thirdplace_group_(.+)$/i,
    /^thirdplace_groups_(.+)$/i,
    /^nummer_3_poule_(.+)$/i,
    /^nummer_3_poules_(.+)$/i,
    /^number_3_group_(.+)$/i,
    /^number_3_groups_(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function extractThirdPlacedCandidateGroups(slot: string): string[] {
  const candidatePart = extractCandidatePart(slot);

  if (!candidatePart) {
    return [];
  }

  const cleaned = candidatePart
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!cleaned) {
    return [];
  }

  const hasSeparators = cleaned.includes("_");

  const rawGroups = hasSeparators
    ? cleaned.split("_").filter(Boolean)
    : cleaned.split("");

  const uniqueGroups: string[] = [];

  for (const group of rawGroups) {
    const normalizedGroup = group.trim().toUpperCase();

    if (!normalizedGroup) {
      continue;
    }

    if (!uniqueGroups.includes(normalizedGroup)) {
      uniqueGroups.push(normalizedGroup);
    }
  }

  return uniqueGroups;
}

export function getRankedThirdPlacedTeams(
  groupLookup: Map<string, TeamStanding[]>
): ThirdPlacedTeam[] {
  const thirdPlacedTeams: ThirdPlacedTeam[] = [];

  for (const [groupLabel, teams] of groupLookup.entries()) {
    if (!isGroupComplete(teams)) {
      continue;
    }

    const groupCode = getGroupCode(groupLabel);
    const thirdPlacedTeam = teams[2];

    if (!groupCode || !thirdPlacedTeam) {
      continue;
    }

    thirdPlacedTeams.push({
      ...thirdPlacedTeam,
      groupLabel,
      groupCode,
      thirdPlaceRank: 0,
    });
  }

  return thirdPlacedTeams
    .sort(compareStandings)
    .map((team, index) => ({
      ...team,
      thirdPlaceRank: index + 1,
    }));
}

export function allKnownGroupsAreComplete(
  groupLookup: Map<string, TeamStanding[]>
): boolean {
  const groups = Array.from(groupLookup.values());

  if (groups.length === 0) {
    return false;
  }

  return groups.every((teams) => isGroupComplete(teams));
}

export function resolveThirdPlacedSlotTeam(
  slot: string,
  groupLookup: Map<string, TeamStanding[]>
): string | null {
  const candidateGroups = extractThirdPlacedCandidateGroups(slot);

  if (candidateGroups.length === 0) {
    return null;
  }

  if (!allKnownGroupsAreComplete(groupLookup)) {
    return null;
  }

  const rankedThirdPlacedTeams = getRankedThirdPlacedTeams(groupLookup);

  if (rankedThirdPlacedTeams.length === 0) {
    return null;
  }

  const qualifiedThirdPlacedTeams = rankedThirdPlacedTeams.slice(
    0,
    ADVANCING_THIRD_PLACED_TEAMS
  );

  const matchingQualifiedTeams = qualifiedThirdPlacedTeams
    .filter((team) => candidateGroups.includes(team.groupCode))
    .sort((a, b) => a.thirdPlaceRank - b.thirdPlaceRank);

  return matchingQualifiedTeams[0]?.team ?? null;
}

export function formatThirdPlacedSlotLabel(slot: string): string | null {
  const candidateGroups = extractThirdPlacedCandidateGroups(slot);

  if (candidateGroups.length === 0) {
    return null;
  }

  return `Nummer 3 Poule ${candidateGroups.join("/")}`;
}
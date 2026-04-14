import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

type StandingsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type MatchRow = {
  id: string;
  stage: string;
  round_name: string;
  home_team: string;
  away_team: string;
  starts_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

type TeamStanding = {
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

type GroupStanding = {
  groupKey: string;
  teams: TeamStanding[];
};

function normalizeGroupLabel(match: MatchRow) {
  const roundName = match.round_name?.trim() ?? "";
  const stage = match.stage?.trim() ?? "";

  const source = roundName || stage;

  const groupMatch =
    source.match(/^group\s+([a-z0-9]+)$/i) ||
    source.match(/^groep\s+([a-z0-9]+)$/i) ||
    source.match(/group\s+([a-z0-9]+)/i) ||
    source.match(/groep\s+([a-z0-9]+)/i);

  if (!groupMatch) {
    return null;
  }

  return `Group ${groupMatch[1].toUpperCase()}`;
}

function isFinishedGroupMatch(match: MatchRow) {
  const groupLabel = normalizeGroupLabel(match);

  if (!groupLabel) {
    return false;
  }

  return (
    match.status === "finished" &&
    match.home_score !== null &&
    match.away_score !== null
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
) {
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
  } else if (homeScore < awayScore) {
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

function buildGroupStandings(matches: MatchRow[]): GroupStanding[] {
  const groups = new Map<string, Map<string, TeamStanding>>();

  for (const match of matches) {
    const groupLabel = normalizeGroupLabel(match);

    if (!groupLabel) {
      continue;
    }

    if (!groups.has(groupLabel)) {
      groups.set(groupLabel, new Map<string, TeamStanding>());
    }

    const table = groups.get(groupLabel)!;

    ensureTeam(table, match.home_team);
    ensureTeam(table, match.away_team);

    if (
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null
    ) {
      applyMatchToTable(
        table,
        match.home_team,
        match.away_team,
        match.home_score,
        match.away_score
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

export default async function PoolStandingsPage({
  params,
}: StandingsPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: pool } = await supabase
    .from("pools")
    .select("id, name, game_type")
    .eq("id", id)
    .maybeSingle();

  if (!pool || pool.game_type !== "world_cup") {
    notFound();
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, stage, round_name, home_team, away_team, starts_at, status, home_score, away_score"
    )
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true });

  const typedMatches = (matches ?? []) as MatchRow[];
  const groupStandings = buildGroupStandings(typedMatches);
  const finishedGroupMatches = typedMatches.filter(isFinishedGroupMatch).length;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-10 sm:py-12">
        <Container>
          <div className="mx-auto flex max-w-5xl flex-col gap-4">
            <div>
              <Link
                href={`/pools/${pool.id}`}
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar pool
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                WK groepenstand
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {pool.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                De groepenstand wordt automatisch opgebouwd op basis van de
                ingevoerde wedstrijduitslagen.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Groepen
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {groupStandings.length}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Verwerkte groepsduels
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {finishedGroupMatches}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Status
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  Automatisch uit uitslagen
                </p>
              </div>
            </div>

            {groupStandings.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {groupStandings.map((group) => (
                  <div
                    key={group.groupKey}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-white">
                        {group.groupKey}
                      </h2>
                      <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
                        {group.teams.length} landen
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-500">
                            <th className="px-2 py-2 text-left font-medium">
                              #
                            </th>
                            <th className="px-2 py-2 text-left font-medium">
                              Land
                            </th>
                            <th className="px-2 py-2 text-right font-medium">
                              G
                            </th>
                            <th className="px-2 py-2 text-right font-medium">
                              W
                            </th>
                            <th className="px-2 py-2 text-right font-medium">
                              G
                            </th>
                            <th className="px-2 py-2 text-right font-medium">
                              V
                            </th>
                            <th className="px-2 py-2 text-right font-medium">
                              +/-
                            </th>
                            <th className="px-2 py-2 text-right font-medium">
                              P
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {group.teams.map((team, index) => (
                            <tr
                              key={team.team}
                              className="border-b border-zinc-800/70 last:border-b-0"
                            >
                              <td className="px-2 py-3 text-left text-zinc-400">
                                {index + 1}
                              </td>
                              <td className="px-2 py-3 font-medium text-white">
                                <div className="flex flex-col">
                                  <span>{team.team}</span>
                                  <span className="text-xs text-zinc-500">
                                    {team.goalsFor}:{team.goalsAgainst}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-3 text-right text-white">
                                {team.played}
                              </td>
                              <td className="px-2 py-3 text-right text-white">
                                {team.wins}
                              </td>
                              <td className="px-2 py-3 text-right text-white">
                                {team.draws}
                              </td>
                              <td className="px-2 py-3 text-right text-white">
                                {team.losses}
                              </td>
                              <td className="px-2 py-3 text-right text-white">
                                {team.goalDifference > 0
                                  ? `+${team.goalDifference}`
                                  : team.goalDifference}
                              </td>
                              <td className="px-2 py-3 text-right font-semibold text-white">
                                {team.points}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5">
                <h2 className="text-lg font-semibold">
                  Nog geen groepsstanden beschikbaar
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Zodra er groepswedstrijden in het schema zitten, verschijnen
                  de standen hier automatisch.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
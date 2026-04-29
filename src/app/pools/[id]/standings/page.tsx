import Image from "next/image";
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
        if (a.goalsAgainst !== b.goalsAgainst) {
          return a.goalsAgainst - b.goalsAgainst;
        }
        return a.team.localeCompare(b.team);
      }),
    }))
    .sort((a, b) => a.groupKey.localeCompare(b.groupKey));
}

function formatGoalDifference(value: number) {
  return value > 0 ? `+${value}` : String(value);
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

  const totalTeams = groupStandings.reduce(
    (count, group) => count + group.teams.length,
    0
  );

  const totalGoals = groupStandings.reduce(
    (total, group) =>
      total +
      group.teams.reduce((groupTotal, team) => groupTotal + team.goalsFor, 0),
    0
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,255,160,0.13),transparent_32%),radial-gradient(circle_at_85%_45%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,#04100c_0%,#030706_54%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-4 sm:py-5">
            <div className="mx-auto max-w-5xl">
              <header className="flex items-center justify-between gap-4">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/brand/poolr-logo-dark.png"
                    alt="Poolr"
                    width={340}
                    height={100}
                    priority
                    className="h-[52px] w-auto sm:h-[64px]"
                  />
                </Link>

                <Link
                  href={`/pools/${pool.id}`}
                  className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/90 backdrop-blur transition hover:bg-white/10 sm:text-sm"
                >
                  Pool
                </Link>
              </header>

              <div className="mt-4 flex flex-col gap-4">
                <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                          World Cup Pool
                        </span>

                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                          Group standings
                        </span>
                      </div>

                      <h1 className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
                        {pool.name}
                      </h1>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                        Group tables are calculated automatically from official
                        World Cup results entered by the admin.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-center lg:min-w-[210px]">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                        Status
                      </p>
                      <p className="mt-1 text-2xl font-black text-white">
                        Automatic
                      </p>
                      <p className="mt-1 text-sm font-semibold text-zinc-400">
                        From results
                      </p>
                    </div>
                  </div>
                </section>

                <div className="grid gap-2 sm:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Groups
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {groupStandings.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Teams
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {totalTeams}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Played
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {finishedGroupMatches}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Goals
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {totalGoals}
                    </p>
                  </div>
                </div>

                {groupStandings.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {groupStandings.map((group) => (
                      <section
                        key={group.groupKey}
                        className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-xl backdrop-blur-xl"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/15 px-4 py-3 sm:px-5">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                              World Cup 2026
                            </p>
                            <h2 className="mt-1 text-xl font-black text-white">
                              {group.groupKey}
                            </h2>
                          </div>

                          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-zinc-300">
                            {group.teams.length} teams
                          </span>
                        </div>

                        <table className="w-full table-fixed text-[11px] font-bold tabular-nums text-zinc-200 sm:text-xs">
                          <thead>
                            <tr className="border-b border-white/10 bg-black/25 text-zinc-500">
                              <th className="w-[30px] px-1 py-2 text-center font-bold uppercase">
                                #
                              </th>
                              <th className="px-1 py-2 text-left font-bold uppercase">
                                Team
                              </th>
                              <th className="w-[26px] px-0.5 py-2 text-center font-bold uppercase">
                                P
                              </th>
                              <th className="w-[26px] px-0.5 py-2 text-center font-bold uppercase">
                                W
                              </th>
                              <th className="w-[26px] px-0.5 py-2 text-center font-bold uppercase">
                                D
                              </th>
                              <th className="w-[26px] px-0.5 py-2 text-center font-bold uppercase">
                                L
                              </th>
                              <th className="w-[30px] px-0.5 py-2 text-center font-bold uppercase">
                                GF
                              </th>
                              <th className="w-[30px] px-0.5 py-2 text-center font-bold uppercase">
                                GA
                              </th>
                              <th className="w-[34px] px-0.5 py-2 text-center font-bold uppercase">
                                GD
                              </th>
                              <th className="w-[34px] px-1 py-2 text-center font-bold uppercase text-white">
                                Pts
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {group.teams.map((team, index) => {
                              const isQualifiedSpot = index < 2;

                              return (
                                <tr
                                  key={team.team}
                                  className={`border-b border-white/10 transition last:border-b-0 ${
                                    isQualifiedSpot
                                      ? "bg-emerald-300/[0.055]"
                                      : "hover:bg-white/[0.025]"
                                  }`}
                                >
                                  <td className="px-1 py-2 text-center">
                                    <span
                                      className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-bold ${
                                        isQualifiedSpot
                                          ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                                          : "border-white/10 bg-black/20 text-zinc-400"
                                      }`}
                                    >
                                      {index + 1}
                                    </span>
                                  </td>

                                  <td className="min-w-0 px-1 py-2 text-left">
                                    <p className="truncate font-bold leading-tight text-white">
                                      {team.team}
                                    </p>
                                  </td>

                                  <td className="px-0.5 py-2 text-center font-bold text-zinc-200">
                                    {team.played}
                                  </td>
                                  <td className="px-0.5 py-2 text-center font-bold text-zinc-200">
                                    {team.wins}
                                  </td>
                                  <td className="px-0.5 py-2 text-center font-bold text-zinc-200">
                                    {team.draws}
                                  </td>
                                  <td className="px-0.5 py-2 text-center font-bold text-zinc-200">
                                    {team.losses}
                                  </td>
                                  <td className="px-0.5 py-2 text-center font-bold text-zinc-200">
                                    {team.goalsFor}
                                  </td>
                                  <td className="px-0.5 py-2 text-center font-bold text-zinc-200">
                                    {team.goalsAgainst}
                                  </td>
                                  <td className="px-0.5 py-2 text-center font-bold text-zinc-200">
                                    {formatGoalDifference(
                                      team.goalDifference
                                    )}
                                  </td>
                                  <td className="px-1 py-2 text-center font-bold text-white">
                                    {team.points}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </section>
                    ))}
                  </div>
                ) : (
                  <section className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.04] p-6 text-center backdrop-blur">
                    <h2 className="text-xl font-black">
                      No group standings available yet
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                      Once group-stage matches exist in the World Cup schedule,
                      standings will appear here automatically.
                    </p>
                  </section>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
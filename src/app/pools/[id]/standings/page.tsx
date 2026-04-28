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

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,255,160,0.13),transparent_32%),radial-gradient(circle_at_85%_45%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,#04100c_0%,#030706_54%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-5 sm:py-6">
            <header className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={340}
                  height={100}
                  priority
                  className="h-[72px] w-auto sm:h-[88px] lg:h-24"
                />
              </Link>

              <Link
                href={`/pools/${pool.id}`}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Pool
              </Link>
            </header>

            <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-5">
              <Link
                href={`/pools/${pool.id}`}
                className="inline-flex w-fit text-sm font-semibold text-zinc-400 transition hover:text-white"
              >
                ← Back to pool
              </Link>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      Group standings
                    </p>
                    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                      {pool.name}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                      Group tables are calculated automatically from official
                      World Cup results entered by the admin.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 sm:min-w-[210px]">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                      Status
                    </p>
                    <p className="mt-2 text-lg font-black text-white">
                      Automatic
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      From match results
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Groups
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {groupStandings.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Teams
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {totalTeams}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Processed matches
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {finishedGroupMatches}
                  </p>
                </div>
              </div>

              {groupStandings.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {groupStandings.map((group) => (
                    <section
                      key={group.groupKey}
                      className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                            World Cup 2026
                          </p>
                          <h2 className="mt-1 text-xl font-black text-white">
                            {group.groupKey}
                          </h2>
                        </div>

                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-zinc-300">
                          {group.teams.length} teams
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-black/20 text-zinc-500">
                              <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wide">
                                #
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wide">
                                Team
                              </th>
                              <th className="px-2 py-3 text-right text-xs font-black uppercase tracking-wide">
                                P
                              </th>
                              <th className="px-2 py-3 text-right text-xs font-black uppercase tracking-wide">
                                W
                              </th>
                              <th className="px-2 py-3 text-right text-xs font-black uppercase tracking-wide">
                                D
                              </th>
                              <th className="px-2 py-3 text-right text-xs font-black uppercase tracking-wide">
                                L
                              </th>
                              <th className="px-2 py-3 text-right text-xs font-black uppercase tracking-wide">
                                GD
                              </th>
                              <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-wide">
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
                                  className={`border-b border-white/10 last:border-b-0 ${
                                    isQualifiedSpot
                                      ? "bg-emerald-300/[0.045]"
                                      : ""
                                  }`}
                                >
                                  <td className="px-3 py-3 text-left">
                                    <span
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-xl border text-xs font-black ${
                                        isQualifiedSpot
                                          ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                                          : "border-white/10 bg-black/20 text-zinc-400"
                                      }`}
                                    >
                                      {index + 1}
                                    </span>
                                  </td>

                                  <td className="px-3 py-3 font-black text-white">
                                    <div className="flex flex-col">
                                      <span>{team.team}</span>
                                      <span className="mt-0.5 text-xs font-medium text-zinc-500">
                                        GF {team.goalsFor} · GA{" "}
                                        {team.goalsAgainst}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="px-2 py-3 text-right text-zinc-200">
                                    {team.played}
                                  </td>
                                  <td className="px-2 py-3 text-right text-zinc-200">
                                    {team.wins}
                                  </td>
                                  <td className="px-2 py-3 text-right text-zinc-200">
                                    {team.draws}
                                  </td>
                                  <td className="px-2 py-3 text-right text-zinc-200">
                                    {team.losses}
                                  </td>
                                  <td className="px-2 py-3 text-right text-zinc-200">
                                    {formatGoalDifference(team.goalDifference)}
                                  </td>
                                  <td className="px-3 py-3 text-right text-base font-black text-white">
                                    {team.points}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-6 backdrop-blur">
                  <h2 className="text-xl font-black">
                    No group standings available yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Once group-stage matches exist in the World Cup schedule,
                    standings will appear here automatically.
                  </p>
                </section>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
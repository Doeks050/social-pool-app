import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import PoolMatchesDateGroup from "@/components/world-cup/PoolMatchesDateGroup";

export const dynamic = "force-dynamic";

type PoolMatchesPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    filter?: string;
  }>;
};

type PredictionRow = {
  id: string;
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  points_awarded: number | null;
};

type MatchRow = {
  id: string;
  stage: string | null;
  round_name: string | null;
  stage_type: string | null;
  group_label: string | null;
  round_order: number | null;
  match_number: number | null;
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

type DateGroup = {
  key: string;
  label: string;
  matches: MatchRow[];
};

type MatchFilter = "all" | "open" | "locked" | "finished";

function getAmsterdamDateParts(value: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return { year, month, day };
}

function getDateKey(value: string) {
  const { year, month, day } = getAmsterdamDateParts(value);
  return `${year}-${month}-${day}`;
}

function getDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

function getMatchState(match: MatchRow): "open" | "locked" | "finished" {
  const hasResult =
    match.status === "finished" &&
    match.home_score !== null &&
    match.away_score !== null;

  if (hasResult) {
    return "finished";
  }

  if (new Date(match.starts_at).getTime() <= Date.now()) {
    return "locked";
  }

  return "open";
}

function normalizeFilter(filter?: string): MatchFilter {
  if (filter === "open") return "open";
  if (filter === "locked") return "locked";
  if (filter === "finished") return "finished";
  return "all";
}

function matchesFilter(match: MatchRow, activeFilter: MatchFilter) {
  if (activeFilter === "all") return true;
  return getMatchState(match) === activeFilter;
}

function getFilterHref(poolId: string, filter: MatchFilter) {
  if (filter === "all") {
    return `/pools/${poolId}/matches`;
  }

  return `/pools/${poolId}/matches?filter=${filter}`;
}

function getFilterButtonClasses(isActive: boolean) {
  if (isActive) {
    return "border-emerald-300 bg-emerald-300 text-zinc-950 shadow-[0_12px_35px_rgba(16,185,129,0.2)]";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-emerald-300/30 hover:text-white";
}

function getFilterLabel(filter: MatchFilter) {
  switch (filter) {
    case "open":
      return "Open";
    case "locked":
      return "Locked";
    case "finished":
      return "Finished";
    default:
      return "All";
  }
}

export default async function PoolMatchesPage({
  params,
  searchParams,
}: PoolMatchesPageProps) {
  noStore();

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const activeFilter = normalizeFilter(resolvedSearchParams.filter);

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
      "id, stage, round_name, stage_type, group_label, round_order, match_number, bracket_code, starts_at, status, home_team, away_team, home_slot, away_slot, home_score, away_score, is_knockout"
    )
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true })
    .order("match_number", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select(
      "id, match_id, predicted_home_score, predicted_away_score, points_awarded"
    )
    .eq("pool_id", pool.id)
    .eq("user_id", user.id);

  const typedMatches = (matches ?? []) as MatchRow[];

  const predictionsByMatchId: Record<string, PredictionRow> =
    Object.fromEntries(
      ((predictions ?? []) as PredictionRow[]).map((prediction) => [
        prediction.match_id,
        prediction,
      ])
    );

  const filteredMatches = typedMatches.filter((match) =>
    matchesFilter(match, activeFilter)
  );

  const dateGroupMap = new Map<string, MatchRow[]>();

  for (const match of filteredMatches) {
    const key = getDateKey(match.starts_at);
    const existing = dateGroupMap.get(key) ?? [];
    existing.push(match);
    dateGroupMap.set(key, existing);
  }

  const groupedMatches: DateGroup[] = Array.from(dateGroupMap.entries())
    .map(([key, dateMatches]) => ({
      key,
      label: getDateLabel(dateMatches[0].starts_at),
      matches: [...dateMatches].sort((a, b) => {
        const timeDiff =
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();

        if (timeDiff !== 0) return timeDiff;

        return (a.match_number ?? 9999) - (b.match_number ?? 9999);
      }),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const totalOpen = typedMatches.filter(
    (match) => getMatchState(match) === "open"
  ).length;
  const totalLocked = typedMatches.filter(
    (match) => getMatchState(match) === "locked"
  ).length;
  const totalFinished = typedMatches.filter(
    (match) => getMatchState(match) === "finished"
  ).length;
  const totalAll = typedMatches.length;

  const filterOptions: { value: MatchFilter; count: number }[] = [
    { value: "all", count: totalAll },
    { value: "open", count: totalOpen },
    { value: "locked", count: totalLocked },
    { value: "finished", count: totalFinished },
  ];

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
                      Match predictions
                    </p>
                    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                      {pool.name}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                      Submit your World Cup predictions before each match locks.
                      Results and points update when official scores are entered.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 sm:min-w-[190px]">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                      Active filter
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {getFilterLabel(activeFilter)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {filteredMatches.length} matches
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur sm:p-5">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                    Filters
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    Find your matches
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <Link
                      key={option.value}
                      href={getFilterHref(pool.id, option.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-black transition ${getFilterButtonClasses(
                        activeFilter === option.value
                      )}`}
                    >
                      {getFilterLabel(option.value)} ({option.count})
                    </Link>
                  ))}
                </div>
              </section>

              {groupedMatches.length > 0 ? (
                <div className="space-y-3">
                  {groupedMatches.map((group, index) => (
                    <PoolMatchesDateGroup
                      key={group.key}
                      label={group.label}
                      poolId={pool.id}
                      matches={group.matches}
                      predictions={predictionsByMatchId}
                      defaultOpen={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-6 backdrop-blur">
                  <h2 className="text-xl font-black">
                    No matches found for this filter
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Choose a different filter or view all matches.
                  </p>

                  <Link
                    href={getFilterHref(pool.id, "all")}
                    className="mt-5 inline-flex rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                  >
                    View all matches
                  </Link>
                </section>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
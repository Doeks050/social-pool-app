import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import { getLanguageFromCookieValue, type Language } from "@/lib/i18n";
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

const copy = {
  en: {
    pool: "Pool",
    worldCupPool: "World Cup Pool",
    matchPredictions: "Match predictions",
    intro: "Submit your predictions before each match locks.",
    activeFilter: "Active filter",
    matches: "matches",
    filters: "Filters",
    current: "Current",
    show: "Show",
    hide: "Hide",
    filterIntro: "Choose which matches you want to view.",
    noMatchesTitle: "No matches found for this filter",
    noMatchesIntro: "Choose a different filter or view all matches.",
    viewAllMatches: "View all matches",
    all: "All",
    open: "Open",
    locked: "Locked",
    finished: "Finished",
  },
  nl: {
    pool: "Poule",
    worldCupPool: "WK-poule",
    matchPredictions: "Wedstrijdvoorspellingen",
    intro: "Vul je voorspellingen in voordat elke wedstrijd sluit.",
    activeFilter: "Actieve filter",
    matches: "wedstrijden",
    filters: "Filters",
    current: "Huidig",
    show: "Toon",
    hide: "Verberg",
    filterIntro: "Kies welke wedstrijden je wilt bekijken.",
    noMatchesTitle: "Geen wedstrijden gevonden voor deze filter",
    noMatchesIntro: "Kies een andere filter of bekijk alle wedstrijden.",
    viewAllMatches: "Bekijk alle wedstrijden",
    all: "Alles",
    open: "Open",
    locked: "Gesloten",
    finished: "Afgelopen",
  },
} satisfies Record<Language, Record<string, string>>;

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

function getDateLabel(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
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

function getFilterLabel(filter: MatchFilter, language: Language) {
  const t = copy[language];

  switch (filter) {
    case "open":
      return t.open;
    case "locked":
      return t.locked;
    case "finished":
      return t.finished;
    default:
      return t.all;
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

  const cookieStore = await cookies();
  const language = getLanguageFromCookieValue(
    cookieStore.get("poolr-language")?.value
  );
  const t = copy[language];

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
      label: getDateLabel(dateMatches[0].starts_at, language),
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
                  {t.pool}
                </Link>
              </header>

              <div className="mt-4 flex flex-col gap-4">
                <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                          {t.worldCupPool}
                        </span>

                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                          {t.matchPredictions}
                        </span>
                      </div>

                      <h1 className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
                        {pool.name}
                      </h1>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                        {t.intro}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 lg:min-w-[190px]">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                        {t.activeFilter}
                      </p>
                      <p className="mt-1 text-2xl font-black text-white">
                        {getFilterLabel(activeFilter, language)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-zinc-400">
                        {filteredMatches.length} {t.matches}
                      </p>
                    </div>
                  </div>
                </section>

                <details
                  className="group rounded-[1.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
                  open={activeFilter !== "all"}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-white/[0.035] sm:px-5 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <h2 className="text-base font-black tracking-tight text-white sm:text-lg">
                        {t.filters}
                      </h2>
                      <p className="mt-0.5 text-xs font-semibold text-zinc-500">
                        {t.current}: {getFilterLabel(activeFilter, language)} ·{" "}
                        {filteredMatches.length} {t.matches}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black text-zinc-300 transition group-open:bg-emerald-300 group-open:text-zinc-950">
                      <span className="group-open:hidden">{t.show}</span>
                      <span className="hidden group-open:inline">{t.hide}</span>
                    </span>
                  </summary>

                  <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5">
                    <p className="mb-3 text-center text-sm leading-5 text-zinc-400">
                      {t.filterIntro}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2">
                      {filterOptions.map((option) => (
                        <Link
                          key={option.value}
                          href={getFilterHref(pool.id, option.value)}
                          className={`rounded-full border px-4 py-2 text-sm font-black transition ${getFilterButtonClasses(
                            activeFilter === option.value
                          )}`}
                        >
                          {getFilterLabel(option.value, language)} (
                          {option.count})
                        </Link>
                      ))}
                    </div>
                  </div>
                </details>

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
                        language={language}
                      />
                    ))}
                  </div>
                ) : (
                  <section className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.04] p-6 text-center backdrop-blur">
                    <h2 className="text-xl font-black">
                      {t.noMatchesTitle}
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                      {t.noMatchesIntro}
                    </p>

                    <Link
                      href={getFilterHref(pool.id, "all")}
                      className="mt-5 inline-flex rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                    >
                      {t.viewAllMatches}
                    </Link>
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
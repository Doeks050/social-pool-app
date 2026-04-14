import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import {
  buildGroupLookup,
  buildGroupStandings,
  resolveSlotLabel,
  type WorldCupMatchRow,
} from "@/lib/world-cup/slotResolver";

type BracketPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type KnockoutRound = {
  key: string;
  label: string;
  order: number;
  matches: WorldCupMatchRow[];
};

function normalizeRound(
  match: WorldCupMatchRow
): { key: string; label: string; order: number } | null {
  const stageType = (match.stage_type ?? "").toLowerCase();
  const value = `${match.round_name ?? ""} ${match.stage ?? ""}`.toLowerCase();

  if (stageType === "round_of_32") {
    return {
      key: "round-of-32",
      label: "Round of 32",
      order: 1,
    };
  }

  if (stageType === "round_of_16") {
    return {
      key: "round-of-16",
      label: "Round of 16",
      order: 2,
    };
  }

  if (stageType === "quarterfinal") {
    return {
      key: "quarterfinals",
      label: "Quarterfinals",
      order: 3,
    };
  }

  if (stageType === "semifinal") {
    return {
      key: "semifinals",
      label: "Semifinals",
      order: 4,
    };
  }

  if (stageType === "third_place") {
    return {
      key: "third-place",
      label: "Third Place",
      order: 5,
    };
  }

  if (stageType === "final") {
    return {
      key: "final",
      label: "Final",
      order: 6,
    };
  }

  if (
    value.includes("round of 32") ||
    value.includes("laatste 32") ||
    value.includes("1/16")
  ) {
    return {
      key: "round-of-32",
      label: "Round of 32",
      order: 1,
    };
  }

  if (
    value.includes("round of 16") ||
    value.includes("laatste 16") ||
    value.includes("achtste finale") ||
    value.includes("1/8")
  ) {
    return {
      key: "round-of-16",
      label: "Round of 16",
      order: 2,
    };
  }

  if (
    value.includes("quarterfinal") ||
    value.includes("quarter final") ||
    value.includes("kwartfinale") ||
    value.includes("1/4")
  ) {
    return {
      key: "quarterfinals",
      label: "Quarterfinals",
      order: 3,
    };
  }

  if (
    value.includes("semifinal") ||
    value.includes("semi final") ||
    value.includes("halve finale") ||
    value.includes("1/2")
  ) {
    return {
      key: "semifinals",
      label: "Semifinals",
      order: 4,
    };
  }

  if (
    value.includes("third place") ||
    value.includes("third-place") ||
    value.includes("3rd place") ||
    value.includes("derde plaats")
  ) {
    return {
      key: "third-place",
      label: "Third Place",
      order: 5,
    };
  }

  if (value.includes("final") || value.includes("finale")) {
    return {
      key: "final",
      label: "Final",
      order: 6,
    };
  }

  return null;
}

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

function getStatus(match: WorldCupMatchRow): "open" | "locked" | "finished" {
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

function getStatusLabel(status: "open" | "locked" | "finished") {
  if (status === "open") return "Open";
  if (status === "locked") return "Gelockt";
  return "Finished";
}

function getStatusClasses(status: "open" | "locked" | "finished") {
  if (status === "open") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "locked") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  return "border-sky-500/30 bg-sky-500/10 text-sky-200";
}

function getDisplayedTeamName(
  directTeam: string | null,
  slot: string | null,
  groupLookup: Map<string, ReturnType<typeof buildGroupStandings>[number]["teams"]>
) {
  if (directTeam && directTeam.trim()) {
    return directTeam;
  }

  const resolved = resolveSlotLabel(slot, groupLookup);

  if (resolved && resolved.trim()) {
    return resolved;
  }

  return "TBD";
}

export default async function PoolBracketPage({ params }: BracketPageProps) {
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
      "id, stage, round_name, stage_type, group_label, round_order, bracket_code, starts_at, status, home_team, away_team, home_slot, away_slot, home_score, away_score, is_knockout"
    )
    .eq("tournament", "world_cup_2026")
    .order("round_order", { ascending: true })
    .order("starts_at", { ascending: true });

  const typedMatches = (matches ?? []) as WorldCupMatchRow[];

  const groupStandings = buildGroupStandings(typedMatches);
  const groupLookup = buildGroupLookup(groupStandings);

  const roundMap = new Map<string, KnockoutRound>();

  for (const match of typedMatches) {
    const round = normalizeRound(match);

    if (!round) {
      continue;
    }

    if (!roundMap.has(round.key)) {
      roundMap.set(round.key, {
        key: round.key,
        label: round.label,
        order: round.order,
        matches: [],
      });
    }

    roundMap.get(round.key)!.matches.push(match);
  }

  const rounds = Array.from(roundMap.values())
    .map((round) => ({
      ...round,
      matches: [...round.matches].sort((a, b) => {
        const orderA = a.round_order ?? 999;
        const orderB = b.round_order ?? 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      }),
    }))
    .sort((a, b) => a.order - b.order);

  const knockoutMatchCount = rounds.reduce(
    (total, round) => total + round.matches.length,
    0
  );

  const finishedKnockoutMatchCount = rounds.reduce(
    (total, round) =>
      total +
      round.matches.filter((match) => getStatus(match) === "finished").length,
    0
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-10 sm:py-12">
        <Container>
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
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
                WK knock-out schema
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {pool.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Deze pagina gebruikt nu ook slot-resolving. Dus imported
                placeholders zoals <span className="font-semibold text-white">winner_group_a</span> en{" "}
                <span className="font-semibold text-white">runnerup_group_b</span>{" "}
                worden automatisch vertaald naar echte landen zodra de
                groepsstand dat toelaat.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Rondes
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {rounds.length}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Knock-out duels
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {knockoutMatchCount}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Finished
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {finishedKnockoutMatchCount}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Groepen beschikbaar
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {groupStandings.length}
                </p>
              </div>
            </div>

            {rounds.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-6 lg:grid-cols-3 sm:grid-cols-2">
                {rounds.map((round) => (
                  <div
                    key={round.key}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
                  >
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-white">
                        {round.label}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {round.matches.length}{" "}
                        {round.matches.length === 1 ? "wedstrijd" : "wedstrijden"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {round.matches.map((match) => {
                        const status = getStatus(match);
                        const homeTeamName = getDisplayedTeamName(
                          match.home_team,
                          match.home_slot,
                          groupLookup
                        );
                        const awayTeamName = getDisplayedTeamName(
                          match.away_team,
                          match.away_slot,
                          groupLookup
                        );

                        return (
                          <div
                            key={match.id}
                            className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${getStatusClasses(
                                  status
                                )}`}
                              >
                                {getStatusLabel(status)}
                              </span>

                              <span className="text-[11px] text-zinc-500">
                                {formatMatchDate(match.starts_at)}
                              </span>
                            </div>

                            {match.bracket_code ? (
                              <div className="mb-3 text-[11px] uppercase tracking-wide text-zinc-500">
                                {match.bracket_code}
                              </div>
                            ) : null}

                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate text-sm font-medium text-white">
                                    {homeTeamName}
                                  </span>
                                  {match.home_slot && !match.home_team ? (
                                    <span className="text-[11px] text-zinc-500">
                                      {match.home_slot}
                                    </span>
                                  ) : null}
                                </div>

                                <span className="text-sm font-semibold text-white">
                                  {match.home_score ?? "-"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate text-sm font-medium text-white">
                                    {awayTeamName}
                                  </span>
                                  {match.away_slot && !match.away_team ? (
                                    <span className="text-[11px] text-zinc-500">
                                      {match.away_slot}
                                    </span>
                                  ) : null}
                                </div>

                                <span className="text-sm font-semibold text-white">
                                  {match.away_score ?? "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5">
                <h2 className="text-lg font-semibold">
                  Nog geen knock-out schema beschikbaar
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Zodra de knock-out wedstrijden in je schema staan, verschijnen
                  ze hier automatisch.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
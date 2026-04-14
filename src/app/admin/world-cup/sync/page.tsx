import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import {
  buildGroupLookup,
  buildGroupStandings,
  resolveSlotTeam,
  type WorldCupMatchRow,
} from "@/lib/world-cup/slotResolver";

type WorldCupSyncPageProps = {
  searchParams?: Promise<{
    success?: string;
    skipped?: string;
    error?: string;
  }>;
};

async function syncWorldCupKnockoutTeams() {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: appAdmin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!appAdmin) {
    notFound();
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, stage, round_name, stage_type, group_label, round_order, bracket_code, starts_at, status, home_team, away_team, home_slot, away_slot, home_score, away_score, is_knockout"
    )
    .eq("tournament", "world_cup_2026")
    .order("round_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (matchesError) {
    redirect(
      `/admin/world-cup/sync?error=${encodeURIComponent(matchesError.message)}`
    );
  }

  const typedMatches = (matches ?? []) as WorldCupMatchRow[];
  const groupStandings = buildGroupStandings(typedMatches);
  const groupLookup = buildGroupLookup(groupStandings);

  const knockoutMatches = typedMatches.filter(
    (match) =>
      match.stage_type !== "group" ||
      match.is_knockout === true ||
      !!match.home_slot ||
      !!match.away_slot
  );

  let updatedCount = 0;
  let skippedCount = 0;

  for (const match of knockoutMatches) {
    const resolvedHomeTeam = resolveSlotTeam(match.home_slot, groupLookup);
    const resolvedAwayTeam = resolveSlotTeam(match.away_slot, groupLookup);

    const nextHomeTeam = resolvedHomeTeam ?? match.home_team ?? null;
    const nextAwayTeam = resolvedAwayTeam ?? match.away_team ?? null;

    const changed =
      (resolvedHomeTeam && resolvedHomeTeam !== match.home_team) ||
      (resolvedAwayTeam && resolvedAwayTeam !== match.away_team);

    if (!changed) {
      skippedCount += 1;
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
      redirect(
        `/admin/world-cup/sync?error=${encodeURIComponent(error.message)}`
      );
    }

    updatedCount += 1;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/world-cup/sync");
  revalidatePath("/admin/world-cup/results");
  revalidatePath("/pools/[id]/bracket", "page");

  redirect(
    `/admin/world-cup/sync?success=${updatedCount}&skipped=${skippedCount}`
  );
}

function getErrorMessage(error: string | undefined) {
  if (!error) return null;
  return decodeURIComponent(error);
}

export default async function WorldCupSyncPage({
  searchParams,
}: WorldCupSyncPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const successCount = resolvedSearchParams?.success
    ? Number(resolvedSearchParams.success)
    : null;
  const skippedCount = resolvedSearchParams?.skipped
    ? Number(resolvedSearchParams.skipped)
    : null;
  const errorMessage = getErrorMessage(resolvedSearchParams?.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: appAdmin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!appAdmin) {
    notFound();
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, stage_type, group_label, home_slot, away_slot, home_team, away_team, status, home_score, away_score"
    )
    .eq("tournament", "world_cup_2026");

  const typedMatches = (matches ?? []) as Array<{
    id: string;
    stage_type: string | null;
    group_label: string | null;
    home_slot: string | null;
    away_slot: string | null;
    home_team: string | null;
    away_team: string | null;
    status: string;
    home_score: number | null;
    away_score: number | null;
  }>;

  const totalMatches = typedMatches.length;
  const groupMatches = typedMatches.filter(
    (match) => match.stage_type === "group"
  ).length;
  const slotMatches = typedMatches.filter(
    (match) => !!match.home_slot || !!match.away_slot
  ).length;
  const finishedGroupMatches = typedMatches.filter(
    (match) =>
      match.stage_type === "group" &&
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null
  ).length;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-16">
        <Container>
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <div>
              <Link
                href="/admin"
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar admin
              </Link>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                App admin
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Sync groepswinnaars naar knock-out
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Deze actie kijkt naar de huidige groepsstanden en vult daarna
                knock-out wedstrijden die werken met slots zoals{" "}
                <span className="font-semibold text-white">winner_group_a</span>{" "}
                en <span className="font-semibold text-white">runnerup_group_b</span>.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Totaal WK matches
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {totalMatches}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Groepswedstrijden
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {groupMatches}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Finished group duels
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {finishedGroupMatches}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Slot matches
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {slotMatches}
                </p>
              </div>
            </div>

            {successCount !== null ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                Sync gelukt. {successCount} knock-out wedstrijden bijgewerkt.
                {skippedCount !== null ? ` ${skippedCount} wedstrijden overgeslagen.` : ""}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h2 className="text-xl font-semibold">Wat deze sync nu doet</h2>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  1. Berekent de huidige groepsstand op basis van finished
                  groepswedstrijden.
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  2. Leest slotcodes zoals{" "}
                  <span className="font-semibold text-white">winner_group_a</span>{" "}
                  en{" "}
                  <span className="font-semibold text-white">runnerup_group_b</span>.
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  3. Schrijft de gevonden landen echt weg naar{" "}
                  <span className="font-semibold text-white">home_team</span> en{" "}
                  <span className="font-semibold text-white">away_team</span> in
                  de knock-out matches.
                </div>
              </div>
            </div>

            <form
              action={syncWorldCupKnockoutTeams}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6"
            >
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Sync uitvoeren</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Gebruik dit nadat je groepsuitslagen hebt ingevoerd of nadat
                    je de officiële WK structuur hebt geïmporteerd.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                  >
                    Sync knock-out teams
                  </button>

                  <Link
                    href="/admin/world-cup/results"
                    className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Naar resultatenbeheer
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </Container>
      </section>
    </main>
  );
}
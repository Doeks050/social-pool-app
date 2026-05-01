import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import { syncKnockoutTeams } from "@/lib/world-cup/syncKnockoutTeams";

type WorldCupSyncPageProps = {
  searchParams?: Promise<{
    success?: string;
    skipped?: string;
    passes?: string;
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

  const { data: appAdmin, error: adminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    redirect(
      `/admin/world-cup/sync?error=${encodeURIComponent(adminError.message)}`
    );
  }

  if (!appAdmin) {
    notFound();
  }

  try {
    const result = await syncKnockoutTeams(supabase);

    revalidatePath("/admin");
    revalidatePath("/admin/world-cup/sync");
    revalidatePath("/admin/world-cup/results");
    revalidatePath("/pools/[id]/bracket", "page");
    revalidatePath("/pools/[id]/matches", "page");

    redirect(
      `/admin/world-cup/sync?success=${result.updatedCount}&skipped=${result.skippedCount}&passes=${result.passes}`
    );
  } catch (error) {
    redirect(
      `/admin/world-cup/sync?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Onbekende fout tijdens knock-out sync."
      )}`
    );
  }
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

  const passesCount = resolvedSearchParams?.passes
    ? Number(resolvedSearchParams.passes)
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
      "id, stage_type, bracket_code, home_slot, away_slot, home_team, away_team, status, home_score, away_score, home_team_locked_by_admin, away_team_locked_by_admin"
    )
    .eq("tournament", "world_cup_2026");

  const typedMatches = (matches ?? []) as Array<{
    id: string;
    stage_type: string | null;
    bracket_code: string | null;
    home_slot: string | null;
    away_slot: string | null;
    home_team: string | null;
    away_team: string | null;
    status: string;
    home_score: number | null;
    away_score: number | null;
    home_team_locked_by_admin: boolean | null;
    away_team_locked_by_admin: boolean | null;
  }>;

  const totalMatches = typedMatches.length;

  const slotMatches = typedMatches.filter(
    (match) => !!match.home_slot || !!match.away_slot
  ).length;

  const filledSlotSides = typedMatches.reduce((total, match) => {
    let count = total;

    if (match.home_slot && match.home_team) {
      count += 1;
    }

    if (match.away_slot && match.away_team) {
      count += 1;
    }

    return count;
  }, 0);

  const lockedSlotSides = typedMatches.reduce((total, match) => {
    let count = total;

    if (match.home_slot && match.home_team_locked_by_admin) {
      count += 1;
    }

    if (match.away_slot && match.away_team_locked_by_admin) {
      count += 1;
    }

    return count;
  }, 0);

  const finishedKnockoutMatches = typedMatches.filter(
    (match) =>
      match.stage_type !== "group" &&
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null
  ).length;

  const progressedMatches = typedMatches.filter(
    (match) =>
      (match.home_slot?.startsWith("winner_") ||
        match.home_slot?.startsWith("loser_") ||
        match.away_slot?.startsWith("winner_") ||
        match.away_slot?.startsWith("loser_")) &&
      match.stage_type !== "group"
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
                Sync knock-out teams
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Deze sync vult knock-out teams automatisch in wanneer slots
                bekend zijn. Als een slot nog niet opgelost kan worden, wordt
                een eerder automatisch ingevuld team weer leeggemaakt. Admin
                overrides blijven staan.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-5">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Totaal
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {totalMatches}
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

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Gevuld
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {filledSlotSides}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Locked
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {lockedSlotSides}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  KO finished
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {finishedKnockoutMatches}
                </p>
              </div>
            </div>

            {successCount !== null ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                Sync gelukt. {successCount} wijzigingen uitgevoerd.
                {skippedCount !== null
                  ? ` ${skippedCount} controles overgeslagen.`
                  : ""}
                {passesCount !== null ? ` Passes: ${passesCount}.` : ""}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h2 className="text-xl font-semibold">Ondersteunde slottypes</h2>

              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <span className="font-semibold text-white">
                    winner_group_a
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-white">
                    runnerup_group_b
                  </span>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <span className="font-semibold text-white">winner_r32_1</span>{" "}
                  / <span className="font-semibold text-white">winner_qf_2</span>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <span className="font-semibold text-white">winner_sf_1</span>{" "}
                  / <span className="font-semibold text-white">loser_sf_1</span>
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
                    Gebruik dit nadat groepsuitslagen of knock-out resultaten
                    zijn ingevuld of gereset. Teams die niet meer logisch
                    bepaald kunnen worden, worden automatisch leeggemaakt.
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

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
              Let op: de beste nummers 3-logica moeten we hierna nog apart
              toevoegen. Deze fix zorgt er nu vooral voor dat onterecht gevulde
              knock-out teams weer worden verwijderd wanneer de groepsfase nog
              niet beslist is.
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
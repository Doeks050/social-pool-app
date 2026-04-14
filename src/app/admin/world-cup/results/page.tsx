import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import MatchResultAdminCard from "@/components/world-cup/MatchResultAdminCard";
import { createClient } from "@/lib/supabase";
import { syncKnockoutTeams } from "@/lib/world-cup/syncKnockoutTeams";
import type { WorldCupMatchRow } from "@/lib/world-cup/slotResolver";

type ResultsPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

async function saveMatchResult(formData: FormData) {
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

  const matchId = String(formData.get("match_id") ?? "").trim();
  const homeScoreRaw = String(formData.get("home_score") ?? "").trim();
  const awayScoreRaw = String(formData.get("away_score") ?? "").trim();

  if (!matchId) {
    redirect(
      "/admin/world-cup/results?error=" +
        encodeURIComponent("Geen wedstrijd id ontvangen.")
    );
  }

  const homeScore = Number(homeScoreRaw);
  const awayScore = Number(awayScoreRaw);

  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    redirect(
      "/admin/world-cup/results?error=" +
        encodeURIComponent("Scores moeten gehele getallen van 0 of hoger zijn.")
    );
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "finished",
    })
    .eq("id", matchId);

  if (updateError) {
    redirect(
      "/admin/world-cup/results?error=" +
        encodeURIComponent(updateError.message)
    );
  }

  try {
    await syncKnockoutTeams(supabase);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Onbekende fout tijdens knock-out sync.";
    redirect(
      "/admin/world-cup/results?error=" + encodeURIComponent(message)
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/world-cup/results");
  revalidatePath("/admin/world-cup/sync");
  revalidatePath("/pools/[id]", "page");
  revalidatePath("/pools/[id]/matches", "page");
  revalidatePath("/pools/[id]/bracket", "page");

  redirect(
    "/admin/world-cup/results?success=" +
      encodeURIComponent("Resultaat opgeslagen en knock-out schema gesynchroniseerd.")
  );
}

function getRoundLabel(match: WorldCupMatchRow) {
  return match.group_label || match.round_name || match.stage || "Wedstrijd";
}

function stageSortValue(match: WorldCupMatchRow) {
  const stageType = (match.stage_type ?? "").toLowerCase();

  if (stageType === "group") return 1;
  if (stageType === "round_of_32") return 2;
  if (stageType === "round_of_16") return 3;
  if (stageType === "quarterfinal") return 4;
  if (stageType === "semifinal") return 5;
  if (stageType === "third_place") return 6;
  if (stageType === "final") return 7;

  return 99;
}

export default async function WorldCupResultsPage({
  searchParams,
}: ResultsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const successMessage = resolvedSearchParams?.success
    ? decodeURIComponent(resolvedSearchParams.success)
    : null;
  const errorMessage = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : null;

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

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      "id, stage, round_name, stage_type, group_label, round_order, bracket_code, starts_at, status, home_team, away_team, home_slot, away_slot, home_score, away_score, is_knockout"
    )
    .eq("tournament", "world_cup_2026")
    .order("round_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="py-16">
          <Container>
            <div className="mx-auto max-w-5xl rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              {error.message}
            </div>
          </Container>
        </section>
      </main>
    );
  }

  const typedMatches = ((matches ?? []) as WorldCupMatchRow[]).sort((a, b) => {
    const stageDiff = stageSortValue(a) - stageSortValue(b);
    if (stageDiff !== 0) {
      return stageDiff;
    }

    const orderA = a.round_order ?? 999;
    const orderB = b.round_order ?? 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  });

  const groupedMatches = typedMatches.reduce<Record<string, WorldCupMatchRow[]>>(
    (acc, match) => {
      const key = getRoundLabel(match);

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(match);
      return acc;
    },
    {}
  );

  const totalMatches = typedMatches.length;
  const finishedMatches = typedMatches.filter(
    (match) =>
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null
  ).length;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-10 sm:py-12">
        <Container>
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
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
                WK resultaten beheren
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Vul hier officiële WK uitslagen in. Na opslaan wordt het
                knock-out schema nu automatisch opnieuw gesynchroniseerd.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Totaal wedstrijden
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {totalMatches}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Finished
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {finishedMatches}
                </p>
              </div>
            </div>

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-6">
              {Object.entries(groupedMatches).map(([groupLabel, groupMatches]) => (
                <section
                  key={groupLabel}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-white">
                      {groupLabel}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {groupMatches.length}{" "}
                      {groupMatches.length === 1 ? "wedstrijd" : "wedstrijden"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {groupMatches.map((match) => (
                      <MatchResultAdminCard
                        key={match.id}
                        match={match}
                        saveAction={saveMatchResult}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
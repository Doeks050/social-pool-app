import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

type WorldCupImportPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

const exampleJson = `[
  {
    "bracket_code": "GA-1",
    "match_number": 1,
    "stage": "Group Stage",
    "round_name": "Group A",
    "stage_type": "group",
    "group_label": "Group A",
    "round_order": 10,
    "starts_at": "2026-06-11T18:00:00Z",
    "home_team": "Mexico",
    "away_team": "Japan",
    "home_slot": null,
    "away_slot": null,
    "is_knockout": false
  },
  {
    "bracket_code": "R32-1",
    "match_number": 49,
    "stage": "Knockout Stage",
    "round_name": "Round of 32",
    "stage_type": "round_of_32",
    "group_label": null,
    "round_order": 20,
    "starts_at": "2026-06-29T18:00:00Z",
    "home_team": null,
    "away_team": null,
    "home_slot": "winner_group_a",
    "away_slot": "runnerup_group_b",
    "is_knockout": true
  }
]`;

function getErrorMessage(error: string | undefined) {
  if (!error) return null;
  if (error === "missing_json") return "Plak eerst JSON in het importveld.";
  if (error === "invalid_json") return "De ingeplakte JSON is ongeldig.";
  if (error === "empty_array") {
    return "De JSON moet een array met wedstrijden bevatten.";
  }
  if (error === "missing_required_fields") {
    return "Minimaal bracket_code, stage_type, round_order en starts_at zijn verplicht.";
  }

  return decodeURIComponent(error);
}

export default async function WorldCupImportPage({
  searchParams,
}: WorldCupImportPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const successCount = resolvedSearchParams?.success
    ? Number(resolvedSearchParams.success)
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

  const { data: existingMatches } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament", "world_cup_2026");

  const totalExistingMatches = existingMatches?.length ?? 0;

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
                WK wedstrijden importeren
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Plak hier de officiële WK wedstrijden als JSON. Deze pagina
                upsert de records op basis van{" "}
                <span className="font-semibold text-white">
                  tournament + bracket_code
                </span>
                , zodat je later veilig opnieuw kunt importeren of corrigeren.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Huidige WK matches
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {totalExistingMatches}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Import type
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  JSON upsert
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Conflict key
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  tournament + bracket_code
                </p>
              </div>
            </div>

            {successCount ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                Import gelukt. {successCount} wedstrijden zijn verwerkt.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h2 className="text-xl font-semibold">Verwachte JSON structuur</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Gebruik voor elke wedstrijd een uniek{" "}
                <span className="font-semibold text-white">bracket_code</span>.
                Voor groepswedstrijden zet je gewoon teams in{" "}
                <span className="font-semibold text-white">home_team</span> en{" "}
                <span className="font-semibold text-white">away_team</span>.
                Voor knock-out placeholders kun je teams leeg laten en werken
                met{" "}
                <span className="font-semibold text-white">home_slot</span> en{" "}
                <span className="font-semibold text-white">away_slot</span>.
              </p>

              <pre className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-xs leading-6 text-zinc-300">
                {exampleJson}
              </pre>
            </div>

            <form
              method="POST"
              action="/admin/world-cup/import/submit"
              className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6"
            >
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Import JSON plakken</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Plak hier de officiële WK agenda in JSON-vorm.
                  </p>
                </div>

                <textarea
                  name="matches_json"
                  rows={20}
                  defaultValue={exampleJson}
                  className="min-h-[420px] w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white"
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                  >
                    WK wedstrijden importeren
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
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/auth";
  const primaryLabel = user ? "Naar dashboard" : "Pool starten";
  const secondaryHref = user ? "/dashboard" : "/auth";
  const secondaryLabel = user ? "Mijn account" : "Inloggen";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="flex min-h-screen items-center py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
              Social Pool App
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Maak je eigen social pool platform
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Start binnen enkele seconden een pool voor collega’s, vrienden of
              familie. Kies je type pool, nodig anderen uit en bekijk automatisch
              standen, voorspellingen en ranglijsten.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href={primaryHref}
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                {primaryLabel}
              </Link>

              <Link
                href={secondaryHref}
                className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-lg font-semibold">WK Poule</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Laat spelers scores voorspellen en volg automatisch de ranglijst.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-lg font-semibold">Office Bingo</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Maak unieke bingo-pools voor werk, events of vriendengroepen.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-lg font-semibold">F1 Poule</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Bouw pools rondom raceweekenden, sessies en seizoensstanden.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
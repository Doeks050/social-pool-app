export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
            Social Pool App
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Maak in één klik je eigen poule voorspellingenspel
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            Start binnen enkele seconden een poule voor collega’s, vrienden of
            familie. Deel een invite link, laat iedereen voorspellingen invullen
            en bekijk automatisch de ranglijst.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
              Poule maken
            </button>

            <button className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900">
              Inloggen
            </button>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-lg font-semibold">Snel opzetten</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Maak met één druk op de knop een nieuwe poule met jouw eigen
              regels en instellingen.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-lg font-semibold">Vrienden uitnodigen</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Deel een code of link zodat anderen direct kunnen deelnemen aan
              jouw voorspellingenspel.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-lg font-semibold">Live ranglijst</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Houd automatisch scores, standen en resultaten bij op één centrale
              plek.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
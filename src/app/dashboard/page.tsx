import { redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name?.trim() || user.email || "Gebruiker";

  async function signOut() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-16">
        <Container>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                  Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Welkom, {displayName}
                </h1>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Je bent ingelogd. Hier bouwen we hierna jouw pool-overzicht,
                  invite flow en WK voorspellingen op.
                </p>
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Uitloggen
                </button>
              </form>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="text-lg font-semibold">Mijn pools</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Hier komt straks het overzicht van alle pools waar je lid van
                  bent.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="text-lg font-semibold">Nieuwe pool</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Binnenkort maak je hier je eerste WK pool aan.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="text-lg font-semibold">Ranglijsten</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Alle scores en standen komen straks automatisch op deze plek.
                </p>
              </div>
            </div>

            <div>
              <Link
                href="/"
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar home
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
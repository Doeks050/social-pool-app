import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import MatchResultAdminCard from "@/components/world-cup/MatchResultAdminCard";

export default async function WorldCupResultsAdminPage() {
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
      "id, stage, round_name, home_team, away_team, starts_at, status, home_score, away_score"
    )
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-16">
        <Container>
          <div className="flex flex-col gap-6">
            <div>
              <Link
                href="/dashboard"
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar dashboard
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
                Hier voer je de officiële WK-uitslagen centraal in. Zodra je een
                uitslag opslaat, wordt de wedstrijd op finished gezet en worden
                alle predictions automatisch opnieuw gescoord.
              </p>
            </div>

            {matches && matches.length > 0 ? (
              <div className="grid gap-4">
                {matches.map((match) => (
                  <MatchResultAdminCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6">
                <h2 className="text-xl font-semibold">
                  Er staan nog geen WK wedstrijden in de database
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  Voeg eerst wedstrijden toe aan de matches tabel.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
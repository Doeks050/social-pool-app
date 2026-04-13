import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

type PoolPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PoolDetailPage({ params }: PoolPageProps) {
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
    .select("id, name, game_type, invite_code, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!pool) {
    notFound();
  }

  const { data: members } = await supabase
    .from("pool_members")
    .select("user_id, role, joined_at")
    .eq("pool_id", id)
    .order("joined_at", { ascending: true });

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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                    Pool overview
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight">
                    {pool.name}
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Speltype:{" "}
                    {pool.game_type === "world_cup"
                      ? "WK Poule"
                      : pool.game_type}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm">
                  <div className="text-zinc-400">Invite code</div>
                  <div className="mt-1 text-lg font-semibold tracking-wider text-white">
                    {pool.invite_code}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="text-lg font-semibold">Jouw rol</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Je bent momenteel <span className="text-white">{membership.role}</span>{" "}
                  in deze pool.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="text-lg font-semibold">Leden</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Deze pool heeft momenteel {members?.length ?? 0}{" "}
                  {(members?.length ?? 0) === 1 ? "lid" : "leden"}.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="text-lg font-semibold">Volgende stap</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Hier bouwen we hierna de join flow, wedstrijden en
                  voorspellingen op.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h2 className="text-2xl font-bold tracking-tight">Pool leden</h2>

              {members && members.length > 0 ? (
                <div className="mt-6 grid gap-3">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-zinc-400">Gebruiker ID</p>
                          <p className="mt-1 text-sm text-white">
                            {member.user_id}
                          </p>
                        </div>
                        <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">
                  Er zijn nog geen leden gevonden.
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

const leaderboardRows = [
  { rank: 1, name: "Alex", points: 42, trend: "+8" },
  { rank: 2, name: "Jamie", points: 38, trend: "+5" },
  { rank: 3, name: "You", points: 35, trend: "+7" },
  { rank: 4, name: "Sam", points: 31, trend: "+3" },
];

const poolTypes = [
  {
    label: "World Cup Pool",
    status: "Live soon",
    icon: "⚽",
    description:
      "Predict match scores, follow standings and compete with friends or colleagues.",
  },
  {
    label: "Bingo",
    status: "Coming soon",
    icon: "🎯",
    description:
      "Create social bingo games for work, parties, events and group challenges.",
  },
  {
    label: "F1 Pool",
    status: "Coming soon",
    icon: "🏎️",
    description:
      "Predict race weekends, sessions and season outcomes in private pools.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create or join",
    text: "Start your own pool or enter one through a private invite link.",
  },
  {
    number: "02",
    title: "Predict and play",
    text: "Make your picks before the deadline and follow the action live.",
  },
  {
    number: "03",
    title: "Climb the board",
    text: "Earn points, beat your friends and stay on top of the leaderboard.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/auth";
  const primaryLabel = user ? "Go to dashboard" : "Create a pool";
  const secondaryHref = user ? "/dashboard" : "/auth";
  const secondaryLabel = user ? "My pools" : "Join a pool";

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(34,255,160,0.18),transparent_34%),radial-gradient(circle_at_80%_65%,rgba(20,184,166,0.13),transparent_28%),linear-gradient(180deg,#04100c_0%,#030706_58%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />

        <Container>
          <div className="relative z-10 flex min-h-screen flex-col">
            <header className="flex items-center justify-between pt-3 pb-0 sm:pt-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={420}
                  height={123}
                  priority
                  className="h-24 w-auto sm:h-28 lg:h-32"
                />
              </Link>

              <Link
                href={user ? "/dashboard" : "/auth"}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                {user ? "Dashboard" : "Login"}
              </Link>
            </header>

            <div className="grid flex-1 items-start gap-10 pt-8 pb-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pt-6 lg:pb-16">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                  World Cup pools launching first
                </div>

                <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl">
                  Play.
                  <br />
                  Predict.
                  <br />
                  Compete.
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
                  Create and join private pools for football, bingo, F1 and
                  more. Built for friends, colleagues and every group that loves
                  a leaderboard.
                </p>

                <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href={primaryHref}
                    className="rounded-2xl bg-emerald-300 px-7 py-4 text-center text-sm font-black text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.3)] transition hover:bg-emerald-200"
                  >
                    {primaryLabel}
                  </Link>

                  <Link
                    href={secondaryHref}
                    className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-center text-sm font-black text-white backdrop-blur transition hover:bg-white/10"
                  >
                    {secondaryLabel}
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap gap-3 text-sm text-zinc-400">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                    One-time entry
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                    Private invite links
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                    Mobile friendly
                  </span>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
                <div className="absolute -inset-8 rounded-[3rem] bg-emerald-400/10 blur-3xl" />

                <div className="relative rotate-[-2deg] rounded-[2rem] border border-white/15 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-xl lg:rotate-[-6deg]">
                  <div className="rounded-[1.55rem] border border-white/10 bg-[#06110d]/95 p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                          Live pool
                        </p>
                        <h2 className="mt-1 text-2xl font-black">
                          Office World Cup
                        </h2>
                      </div>
                      <div className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-zinc-950">
                        24 players
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {leaderboardRows.map((row) => (
                        <div
                          key={row.rank}
                          className={`flex items-center justify-between rounded-2xl border p-4 ${row.name === "You"
                            ? "border-emerald-300/40 bg-emerald-300/10"
                            : "border-white/10 bg-white/[0.04]"
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black ${row.rank === 1
                                ? "bg-emerald-300 text-zinc-950"
                                : "bg-white/10 text-white"
                                }`}
                            >
                              #{row.rank}
                            </div>
                            <div>
                              <p className="font-bold">{row.name}</p>
                              <p className="text-xs text-zinc-400">
                                {row.trend} this round
                              </p>
                            </div>
                          </div>
                          <p className="text-xl font-black">
                            {row.points}
                            <span className="ml-1 text-xs font-semibold text-zinc-500">
                              pts
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Next deadline</span>
                        <span className="font-bold text-white">
                          Friday · 18:00
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-emerald-300 to-teal-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-2 hidden rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 shadow-2xl backdrop-blur-xl sm:block">
                  <p className="text-xs text-zinc-400">Entry from</p>
                  <p className="text-2xl font-black text-emerald-200">€1.99</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative py-20">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {poolTypes.map((type) => (
              <div
                key={type.label}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:border-emerald-300/30 hover:bg-white/[0.06]"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-4xl">{type.icon}</span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-zinc-300">
                    {type.status}
                  </span>
                </div>
                <h2 className="text-xl font-black">{type.label}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Simple enough for everyone. Competitive enough to keep playing.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-[1.75rem] border border-white/10 bg-[#06110d] p-6"
              >
                <p className="text-sm font-black text-emerald-300">
                  {step.number}
                </p>
                <h3 className="mt-5 text-xl font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="rounded-[2rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/15 via-white/[0.05] to-transparent p-8 text-center sm:p-12">
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              Ready to start your first Poolr pool?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-300">
              Launch your World Cup pool first. Bingo and F1 are already on the
              roadmap.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={primaryHref}
                className="rounded-2xl bg-emerald-300 px-7 py-4 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
              >
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-black text-white transition hover:bg-white/10"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
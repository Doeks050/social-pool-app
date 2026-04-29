import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

const leaderboardRows = [
  { rank: 1, name: "Alex", match: 34, bonus: 8, total: 42 },
  { rank: 2, name: "Jamie", match: 31, bonus: 7, total: 38 },
  { rank: 3, name: "You", match: 28, bonus: 7, total: 35 },
  { rank: 4, name: "Sam", match: 27, bonus: 4, total: 31 },
];

const poolTypes = [
  {
    label: "World Cup 2026",
    status: "Live soon",
    kicker: "Football pool",
    description:
      "Predict match scores, follow standings and compete with friends or colleagues.",
  },
  {
    label: "Office Bingo",
    status: "Coming soon",
    kicker: "Social game",
    description:
      "Create social bingo games for work, parties, events and group challenges.",
  },
  {
    label: "F1 Pool",
    status: "Coming soon",
    kicker: "Race predictions",
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

function getRankBadgeClasses(rank: number, isUser: boolean) {
  if (isUser) {
    return "border-emerald-300/35 bg-emerald-300/15 text-emerald-100";
  }

  if (rank === 1) {
    return "border-yellow-300/35 bg-yellow-300/15 text-yellow-100";
  }

  if (rank === 2) {
    return "border-zinc-300/25 bg-zinc-300/10 text-zinc-100";
  }

  if (rank === 3) {
    return "border-orange-300/25 bg-orange-300/10 text-orange-100";
  }

  return "border-white/10 bg-black/25 text-zinc-300";
}

function getRowClasses(rank: number, isUser: boolean) {
  if (isUser) {
    return "border-emerald-300/45 bg-emerald-300/[0.09]";
  }

  if (rank === 1) {
    return "border-yellow-300/30 bg-yellow-300/[0.07]";
  }

  if (rank === 2) {
    return "border-zinc-300/20 bg-zinc-300/[0.045]";
  }

  if (rank === 3) {
    return "border-orange-300/25 bg-orange-300/[0.055]";
  }

  return "border-white/10 bg-white/[0.04]";
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/auth?mode=register";
  const primaryLabel = user ? "Go to dashboard" : "Create a pool";
  const secondaryHref = user ? "/dashboard" : "/auth";
  const secondaryLabel = user ? "My pools" : "Login";

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
                <div className="absolute -right-8 top-10 hidden h-24 w-24 rounded-full border border-emerald-300/20 bg-emerald-300/10 blur-xl sm:block" />
                <div className="absolute -left-10 bottom-20 hidden h-28 w-28 rounded-full border border-teal-300/10 bg-teal-300/10 blur-2xl sm:block" />

                <div className="relative rotate-[-2deg] rounded-[2rem] border border-white/15 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-xl lg:rotate-[-5deg]">
                  <div className="rounded-[1.55rem] border border-white/10 bg-[#06110d]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
                            Leaderboard
                          </span>

                          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold text-zinc-300">
                            24 players
                          </span>
                        </div>

                        <h2 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                          Office World Cup 2026
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-zinc-400">
                          Match points and bonus points combined.
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl border border-yellow-300/25 bg-yellow-300/[0.08] px-2 py-3 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-yellow-100/80">
                          Leader
                        </p>
                        <p className="mt-1 truncate text-sm font-black text-white">
                          Alex
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.09] px-2 py-3 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200">
                          Your rank
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          #3
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-3 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
                          Points
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          35
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                            Current podium
                          </p>
                          <p className="mt-1 text-sm font-black text-white">
                            Top players
                          </p>
                        </div>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold text-zinc-300">
                          Live ranking
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {leaderboardRows.slice(0, 3).map((row) => {
                          const isUser = row.name === "You";

                          return (
                            <div
                              key={row.rank}
                              className={`rounded-xl border px-2 py-2 text-center ${getRowClasses(
                                row.rank,
                                isUser
                              )}`}
                            >
                              <div
                                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-xl border text-[10px] font-black ${getRankBadgeClasses(
                                  row.rank,
                                  isUser
                                )}`}
                              >
                                #{row.rank}
                              </div>

                              <p className="mt-2 truncate text-xs font-black text-white">
                                {row.name}
                              </p>

                              <p className="mt-1 text-[11px] font-black text-zinc-300">
                                {row.total} pts
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {leaderboardRows.map((row) => {
                        const isUser = row.name === "You";

                        return (
                          <div
                            key={row.rank}
                            className={`rounded-2xl border px-3 py-3 ${getRowClasses(
                              row.rank,
                              isUser
                            )}`}
                          >
                            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-black ${getRankBadgeClasses(
                                  row.rank,
                                  isUser
                                )}`}
                              >
                                #{row.rank}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-white">
                                  {row.name}
                                </p>
                                <p className="mt-0.5 text-xs font-semibold text-zinc-500">
                                  Match {row.match} · Bonus {row.bonus}
                                </p>
                              </div>

                              <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-center">
                                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-200">
                                  Total
                                </p>
                                <p className="mt-0.5 text-sm font-black text-white">
                                  {row.total}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                            Next match
                          </p>
                          <p className="mt-1 truncate text-sm font-black text-white">
                            Germany vs Mexico
                          </p>
                        </div>

                        <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-center">
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-200">
                            Locks in
                          </p>
                          <p className="mt-0.5 text-sm font-black text-white">
                            02:14:33
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                    {type.kicker}
                  </span>

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-zinc-300">
                    {type.status}
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-white">
                  {type.label}
                </h2>

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
              Ready to start your first Poolr?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-zinc-300">
              Launch your World Cup pool first. Office Bingo and F1 are already
              on the roadmap.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/auth?mode=register"
                className="rounded-2xl bg-emerald-300 px-9 py-4 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
              >
                Register
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
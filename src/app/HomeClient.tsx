"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Container from "@/components/Container";

type Language = "en" | "nl";

type HomeClientProps = {
  isLoggedIn: boolean;
};

const leaderboardRows = [
  { rank: 1, name: "Alex", match: 34, bonus: 8, total: 42 },
  { rank: 2, name: "Jamie", match: 31, bonus: 7, total: 38 },
  { rank: 3, name: "You", match: 28, bonus: 7, total: 35 },
  { rank: 4, name: "Sam", match: 27, bonus: 4, total: 31 },
];

const copy = {
  en: {
    login: "Login",
    dashboard: "Dashboard",
    primaryGuest: "Create a pool",
    primaryUser: "Go to dashboard",
    secondaryGuest: "Login",
    secondaryUser: "My pools",
    heroTitle: ["Play.", "Predict.", "Compete."],
    heroText:
      "Create and join private pools for football, bingo, F1 and more. Built for friends, colleagues and every group that loves a leaderboard.",
    chips: ["One-time entry", "Private invite links", "Mobile friendly"],
    appPreview: "App preview",
    leaderboard: "Live leaderboard",
    players: "24 players",
    poolName: "Office World Cup 2026",
    poolSubtitle: "Ranking updates after every result.",
    match: "Match",
    bonus: "Bonus",
    total: "Total",
    pts: "pts",
    you: "You",
    poolTypes: [
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
    ],
    howItWorks: "How it works",
    howTitle:
      "Simple enough for everyone. Competitive enough to keep playing.",
    steps: [
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
    ],
    ctaTitle: "Ready to start your first Poolr?",
    ctaText:
      "Launch your World Cup pool first. Office Bingo and F1 are already on the roadmap.",
    register: "Register",
    footerLinks: [
      { label: "How it works", href: "/how-it-works" },
      { label: "World Cup rules", href: "/wk-poule/spelregels" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Contact", href: "/contact" },
    ],
    footerSmall:
      "Poolr is independent and is not affiliated with FIFA, UEFA, Formula 1, FIA or other rights holders.",
  },
  nl: {
    login: "Inloggen",
    dashboard: "Dashboard",
    primaryGuest: "Maak een poule",
    primaryUser: "Naar dashboard",
    secondaryGuest: "Inloggen",
    secondaryUser: "Mijn poules",
    heroTitle: ["Speel.", "Voorspel.", "Win."],
    heroText:
      "Maak en speel privé-poules voor voetbal, Office Bingo, F1 en meer. Gebouwd voor vrienden, collega’s en elke groep die gek is op een ranglijst.",
    chips: ["Eenmalige deelname", "Privé uitnodigingslinks", "Mobielvriendelijk"],
    appPreview: "App voorbeeld",
    leaderboard: "Live ranglijst",
    players: "24 spelers",
    poolName: "Kantoor WK 2026",
    poolSubtitle: "De stand werkt bij na elke uitslag.",
    match: "Wedstrijd",
    bonus: "Bonus",
    total: "Totaal",
    pts: "pnt",
    you: "Jij",
    poolTypes: [
      {
        label: "WK 2026",
        status: "Binnenkort live",
        kicker: "Voetbalpoule",
        description:
          "Voorspel wedstrijduitslagen, volg standen en strijd met vrienden of collega’s.",
      },
      {
        label: "Office Bingo",
        status: "Binnenkort",
        kicker: "Sociaal spel",
        description:
          "Maak sociale bingospellen voor werk, feestjes, evenementen en groepschallenges.",
      },
      {
        label: "F1-poule",
        status: "Binnenkort",
        kicker: "Racevoorspellingen",
        description:
          "Voorspel raceweekenden, sessies en seizoensuitslagen in privé-poules.",
      },
    ],
    howItWorks: "Hoe het werkt",
    howTitle:
      "Simpel genoeg voor iedereen. Competitief genoeg om te blijven spelen.",
    steps: [
      {
        number: "01",
        title: "Maak of join",
        text: "Start je eigen poule of doe mee via een privé uitnodigingslink.",
      },
      {
        number: "02",
        title: "Voorspel en speel",
        text: "Vul je voorspellingen in vóór de deadline en volg de actie live.",
      },
      {
        number: "03",
        title: "Klim op de ranglijst",
        text: "Verdien punten, versla je vrienden en blijf bovenaan staan.",
      },
    ],
    ctaTitle: "Klaar om je eerste Poolr te starten?",
    ctaText:
      "Start eerst met je WK-poule. Office Bingo en F1 staan al op de roadmap.",
    register: "Registreren",
    footerLinks: [
      { label: "Hoe werkt het", href: "/how-it-works" },
      { label: "WK-spelregels", href: "/wk-poule/spelregels" },
      { label: "Privacy", href: "/privacy" },
      { label: "Voorwaarden", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Contact", href: "/contact" },
    ],
    footerSmall:
      "Poolr is onafhankelijk en is niet verbonden aan FIFA, UEFA, Formula 1, FIA of andere rechthebbenden.",
  },
};

type Translation = typeof copy.en;

function getRankBadgeClasses(rank: number, isUser: boolean) {
  if (isUser) return "border-emerald-300/40 bg-emerald-300/20 text-emerald-100";
  if (rank === 1) return "border-yellow-300/45 bg-yellow-300/20 text-yellow-100";
  if (rank === 2) return "border-zinc-300/30 bg-zinc-300/12 text-zinc-100";
  if (rank === 3) return "border-orange-300/35 bg-orange-300/14 text-orange-100";
  return "border-white/10 bg-black/25 text-zinc-300";
}

function getRowClasses(rank: number, isUser: boolean) {
  if (isUser) return "border-emerald-300/45 bg-emerald-300/[0.09]";
  if (rank === 1) return "border-yellow-300/30 bg-yellow-300/[0.07]";
  if (rank === 2) return "border-zinc-300/20 bg-zinc-300/[0.045]";
  if (rank === 3) return "border-orange-300/25 bg-orange-300/[0.055]";
  return "border-white/10 bg-white/[0.04]";
}

function LeaderboardMockup({ t }: { t: Translation }) {
  return (
    <div className="relative mx-auto w-full max-w-[21rem] sm:max-w-xl lg:max-w-none">
      <div className="absolute -inset-8 rounded-[3rem] bg-emerald-400/12 blur-3xl" />
      <div className="absolute left-1/2 top-6 h-32 w-52 -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />

      <div className="relative mx-auto rounded-[2.5rem] border border-white/20 bg-gradient-to-b from-white/14 via-white/6 to-white/[0.03] p-2 shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:rotate-[-2deg] sm:rounded-[2.8rem] sm:p-3 lg:rotate-[-5deg]">
        <div className="pointer-events-none absolute inset-x-12 top-2 z-20 h-5 rounded-b-2xl bg-black/85 sm:inset-x-20" />

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#06110d] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:rounded-[2.2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(110,231,183,0.22),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.055),transparent_32%)]" />

          <div className="relative px-3 pb-4 pt-7 sm:px-5 sm:pb-5 sm:pt-8">
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-300 text-sm font-black text-zinc-950">
                  P
                </div>
                <div>
                  <p className="text-sm font-black leading-none text-white">
                    Poolr
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-zinc-500">
                    {t.appPreview}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-300/12 px-2.5 py-1 text-[10px] font-black text-emerald-200">
                LIVE
              </span>
            </div>

            <div className="mb-4 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/[0.08] p-4 shadow-[0_18px_40px_rgba(16,185,129,0.09)]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                {t.players}
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {t.leaderboard}
              </h2>

              <p className="mt-1 text-xs font-semibold text-zinc-300">
                {t.poolSubtitle}
              </p>
            </div>

            <div className="mb-4 grid grid-cols-3 items-end gap-2">
              <div className="rounded-2xl border border-zinc-300/25 bg-zinc-300/[0.08] px-2 py-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300/30 bg-zinc-300/12 text-sm font-black text-zinc-100">
                  #2
                </div>
                <p className="truncate text-xs font-black text-white">Jamie</p>
                <p className="mt-0.5 text-[11px] font-black text-zinc-400">
                  38 {t.pts}
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-300/35 bg-yellow-300/[0.12] px-2 py-5 text-center shadow-[0_14px_45px_rgba(250,204,21,0.12)]">
                <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-300/40 bg-yellow-300/20 text-base font-black text-yellow-100">
                  #1
                </div>
                <p className="truncate text-sm font-black text-white">Alex</p>
                <p className="mt-0.5 text-xs font-black text-yellow-100">
                  42 {t.pts}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-300/35 bg-emerald-300/[0.1] px-2 py-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-300/16 text-sm font-black text-emerald-100">
                  #3
                </div>
                <p className="truncate text-xs font-black text-white">{t.you}</p>
                <p className="mt-0.5 text-[11px] font-black text-emerald-100">
                  35 {t.pts}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              {leaderboardRows.map((row) => {
                const isUser = row.name === "You";
                const displayName = isUser ? t.you : row.name;

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
                          {displayName}
                        </p>

                        <p className="mt-0.5 text-xs font-semibold text-zinc-500">
                          {t.match} {row.match} · {t.bonus} {row.bonus}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-200">
                          {t.total}
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
          </div>

          <div className="mx-auto mb-3 h-1 w-20 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

export default function HomeClient({ isLoggedIn }: HomeClientProps) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("poolr-language");

    if (savedLanguage === "nl" || savedLanguage === "en") {
      setLanguage(savedLanguage);
      return;
    }

    const browserLanguage = window.navigator.language.toLowerCase();
    const browserLanguages = window.navigator.languages.map((lang) =>
      lang.toLowerCase()
    );

    const prefersDutch =
      browserLanguage.startsWith("nl") ||
      browserLanguages.some((lang) => lang.startsWith("nl"));

    setLanguage(prefersDutch ? "nl" : "en");
  }, []);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("poolr-language", nextLanguage);
  }

  const t = copy[language];

  const primaryHref = isLoggedIn ? "/dashboard" : "/auth?mode=register";
  const primaryLabel = isLoggedIn ? t.primaryUser : t.primaryGuest;
  const secondaryHref = isLoggedIn ? "/dashboard" : "/auth";
  const secondaryLabel = isLoggedIn ? t.secondaryUser : t.secondaryGuest;

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative border-b border-white/10 lg:min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(34,255,160,0.18),transparent_34%),radial-gradient(circle_at_80%_65%,rgba(20,184,166,0.13),transparent_28%),linear-gradient(180deg,#04100c_0%,#030706_58%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />

        <Container>
          <div className="relative z-10 flex flex-col lg:min-h-screen">
            <header className="flex items-center justify-between gap-2 py-3 sm:gap-3 sm:py-5">
              <Link href="/" className="flex min-w-0 items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={420}
                  height={123}
                  priority
                  className="h-12 w-auto sm:h-20 lg:h-28"
                />
              </Link>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="flex rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => changeLanguage("en")}
                    className={`rounded-full px-2 py-1 text-[10px] font-black transition sm:px-3 sm:py-1.5 sm:text-xs ${
                      language === "en"
                        ? "bg-emerald-300 text-zinc-950"
                        : "text-white/70 hover:text-white"
                    }`}
                    aria-pressed={language === "en"}
                  >
                    EN
                  </button>

                  <button
                    type="button"
                    onClick={() => changeLanguage("nl")}
                    className={`rounded-full px-2 py-1 text-[10px] font-black transition sm:px-3 sm:py-1.5 sm:text-xs ${
                      language === "nl"
                        ? "bg-emerald-300 text-zinc-950"
                        : "text-white/70 hover:text-white"
                    }`}
                    aria-pressed={language === "nl"}
                  >
                    NL
                  </button>
                </div>

                <Link
                  href={isLoggedIn ? "/dashboard" : "/auth"}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/10 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {isLoggedIn ? t.dashboard : t.login}
                </Link>
              </div>
            </header>

            <div className="grid flex-1 items-start gap-7 pt-3 pb-10 sm:gap-10 sm:pt-8 sm:pb-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pt-6 lg:pb-16">
              <div className="max-w-3xl">
                <h1 className="text-[2.5rem] font-black leading-[0.95] tracking-tight text-white sm:text-7xl sm:leading-none lg:text-8xl">
                  {t.heroTitle.map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </h1>

                <div className="mt-5 lg:hidden">
                  <LeaderboardMockup t={t} />
                </div>

                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:mt-6 sm:text-xl sm:leading-8">
                  {t.heroText}
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:gap-4">
                  <Link
                    href={primaryHref}
                    className="rounded-2xl bg-emerald-300 px-6 py-3.5 text-center text-sm font-black text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.3)] transition hover:bg-emerald-200 sm:px-7 sm:py-4"
                  >
                    {primaryLabel}
                  </Link>

                  <Link
                    href={secondaryHref}
                    className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-center text-sm font-black text-white backdrop-blur transition hover:bg-white/10 sm:px-7 sm:py-4"
                  >
                    {secondaryLabel}
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-400 sm:mt-7 sm:gap-3 sm:text-sm">
                  {t.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 sm:px-4 sm:py-2"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hidden lg:block">
                <LeaderboardMockup t={t} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative py-16 sm:py-20">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {t.poolTypes.map((type) => (
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

      <section className="border-y border-white/10 bg-white/[0.03] py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">
              {t.howItWorks}
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {t.howTitle}
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {t.steps.map((step) => (
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

      <section className="py-16 sm:py-20">
        <Container>
          <div className="rounded-[2rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/15 via-white/[0.05] to-transparent p-6 text-center sm:p-12">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              {t.ctaTitle}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-zinc-300">
              {t.ctaText}
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/auth?mode=register"
                className="rounded-2xl bg-emerald-300 px-9 py-4 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
              >
                {t.register}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <footer className="border-t border-white/10 bg-[#020403] py-6">
        <Container>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={300}
                  height={88}
                  className="h-16 w-auto sm:h-20"
                />
              </Link>

              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-zinc-400 sm:justify-end"
              >
                {t.footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition hover:text-emerald-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} Poolr. All rights reserved.</p>
              <p className="max-w-2xl sm:text-right">{t.footerSmall}</p>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}
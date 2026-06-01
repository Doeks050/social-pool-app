"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Container from "@/components/Container";
import {
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_STORAGE_KEY,
  detectBrowserLanguage,
} from "@/lib/i18n";

type Language = "en" | "nl";

type HomeClientProps = {
  isLoggedIn: boolean;
};

const copy = {
  en: {
    login: "Login",
    dashboard: "Dashboard",
    heroEyebrow: "World Cup 2026 pools",
    heroTitle: "Private prediction pools made easy.",
    heroText:
      "Predict World Cup matches with friends, colleagues or your office team. Create a pool, share the invite code and follow the leaderboard together.",
    primaryGuest: "Create a pool",
    primaryUser: "Open dashboard",
    secondaryGuest: "Log in",
    secondaryUser: "Create pool",
    trustOne: "Private groups",
    trustTwo: "Match predictions",
    trustThree: "Live leaderboard",
    previewKicker: "WK 2026",
    previewTitle: "Office pool",
    previewSubtitle: "Match predictions",
    previewOpen: "Open",
    previewSaved: "Saved",
    previewCta: "Predict now",
    matchOne: "Netherlands",
    matchTwo: "France",
    matchThree: "Brazil",
    matchFour: "Germany",
    scoreLabel: "Your score",
    ranking: "Live ranking",
    rankingText: "#3 of 24 players",
    points: "35 pts",
    modulesEyebrow: "Game formats",
    modulesTitle: "Start simple. Expand later.",
    modulesText:
      "Poolr starts with World Cup prediction pools and is built to support more group games over time.",
    modules: [
      {
        title: "World Cup 2026",
        status: "Live first",
        text: "Predict match scores, follow standings and compete in a private group.",
      },
      {
        title: "Office Bingo",
        status: "Coming soon",
        text: "Create social bingo games for work, parties and group challenges.",
      },
      {
        title: "F1 Pool",
        status: "Coming soon",
        text: "Predict race weekends, sessions and season results.",
      },
    ],
    stepsEyebrow: "How it works",
    stepsTitle: "Three steps to start playing.",
    steps: [
      {
        number: "01",
        title: "Create or join",
        text: "Start your own pool or join one with an invite code.",
      },
      {
        number: "02",
        title: "Predict",
        text: "Enter your match scores before the deadline closes.",
      },
      {
        number: "03",
        title: "Compete",
        text: "Follow the leaderboard and climb above your friends.",
      },
    ],
    finalTitle: "Ready to start your first Poolr?",
    finalText:
      "Create your first World Cup pool and invite your group in minutes.",
    finalButton: "Get started",
    footerSmall:
      "Poolr is independent and is not affiliated with FIFA, UEFA, Formula 1, FIA or other rights holders.",
    footerLinks: [
      { label: "How it works", href: "/how-it-works" },
      { label: "World Cup rules", href: "/wk-poule/spelregels" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Billing", href: "/billing" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Contact", href: "/contact" },
    ],
  },
  nl: {
    login: "Inloggen",
    dashboard: "Dashboard",
    heroEyebrow: "WK 2026-poules",
    heroTitle: "Privé poules eenvoudig geregeld.",
    heroText:
      "Voorspel WK-wedstrijden met vrienden, collega’s of je kantoor. Maak een poule, deel de invite code en volg samen de ranglijst.",
    primaryGuest: "Maak een poule",
    primaryUser: "Open dashboard",
    secondaryGuest: "Inloggen",
    secondaryUser: "Poule maken",
    trustOne: "Privé groepen",
    trustTwo: "Wedstrijden voorspellen",
    trustThree: "Live ranglijst",
    previewKicker: "WK 2026",
    previewTitle: "Kantoor poule",
    previewSubtitle: "Wedstrijden voorspellen",
    previewOpen: "Open",
    previewSaved: "Opgeslagen",
    previewCta: "Voorspel nu",
    matchOne: "Nederland",
    matchTwo: "Frankrijk",
    matchThree: "Brazilië",
    matchFour: "Duitsland",
    scoreLabel: "Jouw score",
    ranking: "Live stand",
    rankingText: "#3 van 24 spelers",
    points: "35 pnt",
    modulesEyebrow: "Spelvormen",
    modulesTitle: "Begin simpel. Breid later uit.",
    modulesText:
      "Poolr start met WK-voorspellingpoules en is gebouwd om later meer groepsspellen te ondersteunen.",
    modules: [
      {
        title: "WK 2026",
        status: "Als eerste live",
        text: "Voorspel wedstrijduitslagen, volg standen en speel in een privé groep.",
      },
      {
        title: "Office Bingo",
        status: "Binnenkort",
        text: "Maak sociale bingo’s voor werk, feestjes en groepschallenges.",
      },
      {
        title: "F1-poule",
        status: "Binnenkort",
        text: "Voorspel raceweekenden, sessies en seizoensuitslagen.",
      },
    ],
    stepsEyebrow: "Hoe het werkt",
    stepsTitle: "In drie stappen klaar om te spelen.",
    steps: [
      {
        number: "01",
        title: "Maak of join",
        text: "Start je eigen poule of doe mee via een invite code.",
      },
      {
        number: "02",
        title: "Voorspel",
        text: "Vul je wedstrijduitslagen in voordat de deadline sluit.",
      },
      {
        number: "03",
        title: "Strijd mee",
        text: "Volg de ranglijst en klim boven je vrienden uit.",
      },
    ],
    finalTitle: "Klaar om je eerste Poolr te starten?",
    finalText:
      "Maak je eerste WK-poule en nodig je groep binnen een paar minuten uit.",
    finalButton: "Begin nu",
    footerSmall:
      "Poolr is onafhankelijk en is niet verbonden aan FIFA, UEFA, Formula 1, FIA of andere rechthebbenden.",
    footerLinks: [
      { label: "Hoe werkt het", href: "/how-it-works" },
      { label: "WK-spelregels", href: "/wk-poule/spelregels" },
      { label: "Privacy", href: "/privacy" },
      { label: "Voorwaarden", href: "/terms" },
      { label: "Betalingen", href: "/billing" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Contact", href: "/contact" },
    ],
  },
};

type HomeCopy = typeof copy.en;

function setLanguageCookie(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; SameSite=Lax`;
}

function PreviewCard({ t }: { t: HomeCopy }) {
  return (
    <div className="relative mx-auto w-full max-w-[430px] lg:ml-auto">
      <div className="absolute -inset-5 rounded-[2.5rem] bg-emerald-400/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-2.5 shadow-2xl backdrop-blur-xl sm:p-3">
        <div className="rounded-[1.55rem] border border-white/10 bg-[#06110d] p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                {t.previewKicker}
              </p>
              <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-white">
                {t.previewTitle}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">{t.previewSubtitle}</p>
            </div>

            <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[10px] font-black text-emerald-200">
              LIVE
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-3">
              <div className="mb-3 flex items-center justify-between text-[10px] font-black">
                <span className="rounded-full bg-black/25 px-2.5 py-1 text-emerald-200">
                  {t.previewOpen}
                </span>
                <span className="text-zinc-400">Today 21:00</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <p className="truncate text-sm font-black">{t.matchOne}</p>

                <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500">
                    {t.scoreLabel}
                  </p>
                  <p className="mt-1 text-lg font-black text-zinc-400">— - —</p>
                </div>

                <p className="truncate text-right text-sm font-black">
                  {t.matchTwo}
                </p>
              </div>

              <div className="mt-3 rounded-xl bg-emerald-300 px-3 py-2 text-center text-xs font-black text-zinc-950">
                + {t.previewCta}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-3 flex items-center justify-between text-[10px] font-black">
                <span className="rounded-full bg-black/25 px-2.5 py-1 text-zinc-300">
                  {t.previewSaved}
                </span>
                <span className="text-zinc-500">Tomorrow 18:00</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <p className="truncate text-sm font-black">{t.matchThree}</p>

                <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500">
                    {t.scoreLabel}
                  </p>
                  <p className="mt-1 text-lg font-black text-white">2 - 1</p>
                </div>

                <p className="truncate text-right text-sm font-black">
                  {t.matchFour}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                  {t.ranking}
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  {t.rankingText}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm font-black text-emerald-100">
                {t.points}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeClient({ isLoggedIn }: HomeClientProps) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLanguage === "nl" || savedLanguage === "en") {
      setLanguage(savedLanguage);
      setLanguageCookie(savedLanguage);
      return;
    }

    const detectedLanguage = detectBrowserLanguage();

    setLanguage(detectedLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLanguage);
    setLanguageCookie(detectedLanguage);
  }, []);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    setLanguageCookie(nextLanguage);
  }

  const t = copy[language];

  const primaryHref = isLoggedIn ? "/dashboard" : "/auth?mode=register";
  const primaryLabel = isLoggedIn ? t.primaryUser : t.primaryGuest;
  const secondaryHref = isLoggedIn ? "/pools/new" : "/auth";
  const secondaryLabel = isLoggedIn ? t.secondaryUser : t.secondaryGuest;

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_5%,rgba(110,231,183,0.16),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(20,184,166,0.12),transparent_28%),linear-gradient(180deg,#06110d_0%,#030706_60%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:56px_56px]" />

        <Container>
          <div className="relative z-10 flex min-h-[760px] flex-col sm:min-h-screen">
            <header className="flex items-center justify-between gap-3 py-4 sm:py-5">
              <Link href="/" className="flex min-w-0 items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={300}
                  height={88}
                  priority
                  className="h-12 w-auto sm:h-16 lg:h-[72px]"
                />
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                <div className="flex rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => changeLanguage("en")}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black transition sm:px-3 sm:py-1.5 sm:text-xs ${
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
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black transition sm:px-3 sm:py-1.5 sm:text-xs ${
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
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/90 backdrop-blur transition hover:bg-white/10 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {isLoggedIn ? t.dashboard : t.login}
                </Link>
              </div>
            </header>

            <div className="grid flex-1 items-center gap-8 pb-12 pt-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.82fr)] lg:gap-12 lg:pb-16 lg:pt-4">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200 sm:px-4 sm:text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                  {t.heroEyebrow}
                </div>

                <h1 className="max-w-[11ch] text-[clamp(2.7rem,7vw,5.6rem)] font-black leading-[0.95] tracking-[-0.055em] text-white sm:max-w-[12ch] lg:max-w-[11ch]">
                  {t.heroTitle}
                </h1>

                <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:mt-6 sm:text-lg sm:leading-8">
                  {t.heroText}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={primaryHref}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-300 px-6 text-sm font-black text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.22)] transition hover:bg-emerald-200 sm:min-w-[180px]"
                  >
                    {primaryLabel}
                  </Link>

                  <Link
                    href={secondaryHref}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-6 text-sm font-black text-white backdrop-blur transition hover:border-white/25 hover:bg-white/10 sm:min-w-[160px]"
                  >
                    {secondaryLabel}
                  </Link>
                </div>

                <div className="mt-6 grid max-w-xl grid-cols-1 gap-2 text-center sm:grid-cols-3 sm:gap-3">
                  {[t.trustOne, t.trustTwo, t.trustThree].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-3 text-xs font-bold text-zinc-300 sm:text-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:pl-2">
                <PreviewCard t={t} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              {t.modulesEyebrow}
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {t.modulesTitle}
            </h2>

            <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
              {t.modulesText}
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {t.modules.map((module) => (
              <div
                key={module.title}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur transition hover:border-emerald-300/30 hover:bg-white/[0.065] sm:p-6"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    {module.status}
                  </span>
                </div>

                <h3 className="text-2xl font-black tracking-tight text-white">
                  {module.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {module.text}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              {t.stepsEyebrow}
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {t.stepsTitle}
            </h2>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {t.steps.map((step) => (
              <div
                key={step.number}
                className="rounded-[1.75rem] border border-white/10 bg-[#06110d] p-5 sm:p-6"
              >
                <p className="text-sm font-black text-emerald-300">
                  {step.number}
                </p>

                <h3 className="mt-5 text-xl font-black text-white">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <div className="rounded-[2rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/15 via-white/[0.05] to-transparent p-6 text-center sm:p-12">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              {t.finalTitle}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              {t.finalText}
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href={primaryHref}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-300 px-8 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
              >
                {isLoggedIn ? t.primaryUser : t.finalButton}
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
                  width={260}
                  height={76}
                  className="h-14 w-auto sm:h-16"
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

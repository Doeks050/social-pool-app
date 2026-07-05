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
    dashboard: "Open dashboard",
    createPool: "Create a pool",
    eyebrow: "World Cup 2026 pools",
    title: "Your pool starts here.",
    text: "Log in to create or manage a private prediction pool for friends, colleagues or your office team.",
    smallInfo: "Private invite code · Match predictions · Leaderboard",
    helpTitle: "New to Poolr?",
    helpText:
      "Create a pool, share the invite code and let your group fill in their predictions before the match deadline.",
    footer:
      "Poolr is independent and is not affiliated with FIFA, UEFA, Formula 1, FIA or other rights holders.",
    footerLinks: [
      { label: "How it works", href: "/how-it-works" },
      { label: "World Cup rules", href: "/wk-poule/spelregels" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
  nl: {
    login: "Inloggen",
    dashboard: "Open dashboard",
    createPool: "Poule maken",
    eyebrow: "WK 2026-poules",
    title: "Je poule start hier.",
    text: "Log in om een privé voorspellingpoule te maken of te beheren voor vrienden, collega’s of je kantoor.",
    smallInfo: "Privé invite code · Wedstrijden voorspellen · Ranglijst",
    helpTitle: "Nieuw bij Poolr?",
    helpText:
      "Maak een poule, deel de invite code en laat je groep voorspellingen invullen voor de wedstrijddeadline.",
    footer:
      "Poolr is onafhankelijk en is niet verbonden aan FIFA, UEFA, Formula 1, FIA of andere rechthebbenden.",
    footerLinks: [
      { label: "Hoe werkt het", href: "/how-it-works" },
      { label: "WK-spelregels", href: "/wk-poule/spelregels" },
      { label: "Privacy", href: "/privacy" },
      { label: "Voorwaarden", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
};

function setLanguageCookie(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; SameSite=Lax`;
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
  const loginHref = isLoggedIn ? "/dashboard" : "/auth";
  const loginLabel = isLoggedIn ? t.dashboard : t.login;

  return (
    <main className="flex min-h-screen flex-col bg-[#030706] text-white">
      <section className="flex flex-1 flex-col border-b border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_38%),linear-gradient(180deg,#06110d_0%,#030706_72%)]">
        <Container>
          <header className="flex items-center justify-between gap-3 py-4 sm:py-5">
            <Link href="/" className="flex min-w-0 items-center">
              <Image
                src="/brand/poolr-logo-dark.png"
                alt="Poolr"
                width={260}
                height={76}
                priority
                className="h-11 w-auto sm:h-14"
              />
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                <button
                  type="button"
                  onClick={() => changeLanguage("en")}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black transition sm:px-3 sm:py-1.5 sm:text-xs ${
                    language === "en"
                      ? "bg-emerald-300 text-zinc-950"
                      : "text-white/60 hover:text-white"
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
                      : "text-white/60 hover:text-white"
                  }`}
                  aria-pressed={language === "nl"}
                >
                  NL
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col items-center justify-center py-14 text-center sm:py-20">
            <p className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200 sm:text-xs">
              {t.eyebrow}
            </p>

            <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl">
              {t.title}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
              {t.text}
            </p>

            <div className="mt-8 w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/25 sm:p-5">
              <Link
                href={loginHref}
                className="flex min-h-13 w-full items-center justify-center rounded-2xl bg-emerald-300 px-7 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
              >
                {loginLabel}
              </Link>

              <Link
                href="/auth?mode=register"
                className="mt-3 flex min-h-13 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-7 text-sm font-black text-white transition hover:bg-white/[0.08]"
              >
                {t.createPool}
              </Link>
            </div>

            <p className="mt-5 text-sm font-medium text-zinc-500">{t.smallInfo}</p>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-14">
        <Container>
          <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {t.helpTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400 sm:text-base">
              {t.helpText}
            </p>
          </div>
        </Container>
      </section>

      <footer className="mt-auto border-t border-white/10 bg-[#020403] py-6">
        <Container>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={220}
                  height={64}
                  className="h-10 w-auto sm:h-11"
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
              <p className="max-w-2xl sm:text-right">{t.footer}</p>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}

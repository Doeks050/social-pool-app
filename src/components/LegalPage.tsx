"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Container from "@/components/Container";
import type { Language, LegalPageContent } from "../data/legalPages";

type LegalPageProps = {
  content: Record<Language, LegalPageContent>;
};

export default function LegalPage({ content }: LegalPageProps) {
  const [language, setLanguage] = useState<Language>("nl");

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

  const t = content[language];

  return (
    <main className="min-h-screen bg-[#030706] py-16 text-white sm:py-24">
      <Container className="max-w-4xl">
        <Link
          href="/"
          className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          {t.backLabel}
        </Link>

        <article className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
            {t.label}
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {t.title}
          </h1>

          <p className="mt-5 text-base leading-8 text-zinc-300">{t.intro}</p>

          <p className="mt-4 text-sm leading-7 text-zinc-500">
            {t.updatedLabel}: {t.updatedAt}
          </p>

          <div className="mt-10 space-y-8">
            {t.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-black text-white">
                  {section.title}
                </h2>

                {Array.isArray(section.body) ? (
                  <div className="mt-3 space-y-3">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="leading-7 text-zinc-300">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 leading-7 text-zinc-300">
                    {section.body}
                  </p>
                )}
              </section>
            ))}
          </div>
        </article>
      </Container>
    </main>
  );
}
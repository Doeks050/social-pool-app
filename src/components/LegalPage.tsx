import Link from "next/link";
import Container from "@/components/Container";

type LegalSection = {
  title: string;
  body: string | string[];
};

type LegalPageProps = {
  label: string;
  title: string;
  intro: string;
  updatedAt?: string;
  sections: LegalSection[];
};

export default function LegalPage({
  label,
  title,
  intro,
  updatedAt = "1 mei 2026",
  sections,
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#030706] py-16 text-white sm:py-24">
      <Container className="max-w-4xl">
        <Link
          href="/"
          className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          Terug naar home
        </Link>

        <article className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
            {label}
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>

          <p className="mt-5 text-base leading-8 text-zinc-300">{intro}</p>

          <p className="mt-4 text-sm leading-7 text-zinc-500">
            Laatst bijgewerkt: {updatedAt}
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
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
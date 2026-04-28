import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import BonusQuestionsForm from "@/components/world-cup/BonusQuestionsForm";

type PoolBonusPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type BonusQuestionTemplateRow = {
  id: string;
  question_key: string;
  label: string;
  description: string | null;
  answer_type: string;
  options: string[];
  lock_mode: string;
  points_value: number;
  sort_order: number;
  is_active: boolean;
};

type BonusQuestionAnswerRow = {
  question_id: string;
  answer_value: string;
};

type FirstMatchRow = {
  starts_at: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

export default async function PoolBonusPage({ params }: PoolBonusPageProps) {
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
    .select("id, name, game_type")
    .eq("id", id)
    .maybeSingle();

  if (!pool || pool.game_type !== "world_cup") {
    notFound();
  }

  const { data: templates } = await supabase
    .from("bonus_question_templates")
    .select(
      "id, question_key, label, description, answer_type, options, lock_mode, points_value, sort_order, is_active"
    )
    .eq("game_type", "world_cup")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: answers } = await supabase
    .from("bonus_question_answers")
    .select("question_id, answer_value")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id);

  const { data: firstMatch } = await supabase
    .from("matches")
    .select("starts_at")
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const typedTemplates = (templates ?? []) as BonusQuestionTemplateRow[];
  const typedAnswers = (answers ?? []) as BonusQuestionAnswerRow[];
  const typedFirstMatch = firstMatch as FirstMatchRow | null;

  const answersMap = new Map(
    typedAnswers.map((answer) => [answer.question_id, answer.answer_value])
  );

  const lockAt = typedFirstMatch?.starts_at ?? null;
  const isLocked = lockAt ? new Date(lockAt).getTime() <= Date.now() : false;
  const formattedLockAt = lockAt ? formatDateTime(lockAt) : null;

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,255,160,0.13),transparent_32%),radial-gradient(circle_at_85%_45%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,#04100c_0%,#030706_54%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-5 sm:py-6">
            <header className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={340}
                  height={100}
                  priority
                  className="h-[72px] w-auto sm:h-[88px] lg:h-24"
                />
              </Link>

              <Link
                href={`/pools/${pool.id}`}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Pool
              </Link>
            </header>

            <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-5">
              <Link
                href={`/pools/${pool.id}`}
                className="inline-flex w-fit text-sm font-semibold text-zinc-400 transition hover:text-white"
              >
                ← Back to pool
              </Link>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      Bonus questions
                    </p>
                    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                      {pool.name}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                      Submit your World Cup bonus answers before the first match
                      starts. Correct answers can add valuable points to your
                      leaderboard score.
                    </p>
                  </div>

                  {formattedLockAt ? (
                    <div
                      className={`rounded-[1.5rem] border px-5 py-4 sm:min-w-[210px] ${
                        isLocked
                          ? "border-orange-300/25 bg-orange-300/10"
                          : "border-emerald-300/20 bg-emerald-300/10"
                      }`}
                    >
                      <p
                        className={`text-xs font-black uppercase tracking-[0.2em] ${
                          isLocked ? "text-orange-100" : "text-emerald-200"
                        }`}
                      >
                        Deadline
                      </p>
                      <p className="mt-2 text-lg font-black text-white">
                        {formattedLockAt}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {isLocked ? "Locked" : "Still open"}
                      </p>
                    </div>
                  ) : null}
                </div>

                {isLocked ? (
                  <div className="mt-5 rounded-2xl border border-orange-300/25 bg-orange-300/10 px-4 py-3 text-sm text-orange-100">
                    Bonus questions are locked.
                  </div>
                ) : null}

                {!formattedLockAt ? (
                  <div className="mt-5 rounded-2xl border border-orange-300/25 bg-orange-300/10 px-4 py-3 text-sm text-orange-100">
                    No first World Cup match has been found yet.
                  </div>
                ) : null}
              </section>

              {typedTemplates.length > 0 ? (
                <BonusQuestionsForm
                  poolId={pool.id}
                  isLocked={isLocked}
                  questions={typedTemplates.map((question) => ({
                    id: question.id,
                    questionKey: question.question_key,
                    label: question.label,
                    description: question.description,
                    answerType: question.answer_type,
                    options: question.options ?? [],
                    pointsValue: question.points_value,
                    initialAnswer: answersMap.get(question.id) ?? "",
                  }))}
                />
              ) : (
                <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-6 backdrop-blur">
                  <h2 className="text-xl font-black">
                    No bonus questions yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Add active World Cup bonus questions in the
                    bonus_question_templates table first.
                  </p>
                </section>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
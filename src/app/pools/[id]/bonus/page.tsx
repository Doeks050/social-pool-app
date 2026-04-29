import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import BonusQuestionsForm from "@/components/world-cup/BonusQuestionsForm";
import BonusDeadlineCountdown from "@/components/world-cup/BonusDeadlineCountdown";

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

  const answeredCount = typedTemplates.filter((question) =>
    answersMap.get(question.id)?.trim()
  ).length;

  const totalPoints = typedTemplates.reduce(
    (total, question) => total + question.points_value,
    0
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,255,160,0.13),transparent_32%),radial-gradient(circle_at_85%_45%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,#04100c_0%,#030706_54%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-4 sm:py-5">
            <div className="mx-auto max-w-5xl">
              <header className="flex items-center justify-between gap-4">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/brand/poolr-logo-dark.png"
                    alt="Poolr"
                    width={340}
                    height={100}
                    priority
                    className="h-[52px] w-auto sm:h-[64px]"
                  />
                </Link>

                <Link
                  href={`/pools/${pool.id}`}
                  className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/90 backdrop-blur transition hover:bg-white/10 sm:text-sm"
                >
                  Pool
                </Link>
              </header>

              <div className="mt-4 flex flex-col gap-4">
                <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                          World Cup Pool
                        </span>

                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                          Bonus questions
                        </span>
                      </div>

                      <h1 className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
                        {pool.name}
                      </h1>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                        Bonus answers lock exactly when the first World Cup
                        match kicks off. Submit them before the countdown reaches
                        zero.
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                            Questions
                          </p>
                          <p className="mt-1 text-xl font-black text-white">
                            {typedTemplates.length}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                            Answered
                          </p>
                          <p className="mt-1 text-xl font-black text-white">
                            {answeredCount}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                            Max points
                          </p>
                          <p className="mt-1 text-xl font-black text-white">
                            {totalPoints}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <BonusDeadlineCountdown
                        lockAt={lockAt}
                        isLocked={isLocked}
                      />

                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                          Deadline time
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {formattedLockAt ?? "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isLocked ? (
                    <div className="mt-4 rounded-2xl border border-orange-300/25 bg-orange-300/10 px-4 py-3 text-center text-sm font-semibold text-orange-100">
                      Bonus answers are locked because the first World Cup match
                      has started.
                    </div>
                  ) : null}

                  {!formattedLockAt ? (
                    <div className="mt-4 rounded-2xl border border-orange-300/25 bg-orange-300/10 px-4 py-3 text-center text-sm font-semibold text-orange-100">
                      The first World Cup match could not be found yet. Check
                      the imported match schedule.
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
                  <section className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.04] p-6 text-center backdrop-blur">
                    <h2 className="text-xl font-black">
                      No bonus questions yet
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                      Add active World Cup bonus questions in the
                      bonus_question_templates table first.
                    </p>
                  </section>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
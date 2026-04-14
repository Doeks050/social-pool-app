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

function formatDutchDateTime(value: string) {
  const date = new Date(value);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export default async function PoolBonusPage({
  params,
}: PoolBonusPageProps) {
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
  const formattedLockAt = lockAt ? formatDutchDateTime(lockAt) : null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-10 sm:py-12">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <div>
              <Link
                href={`/pools/${pool.id}`}
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar pool
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    WK bonusvragen
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    {pool.name}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Vul je bonusvragen in vóór de eerste wedstrijd begint.
                  </p>
                </div>

                {formattedLockAt ? (
                  <div
                    className={`rounded-xl border px-3 py-2 text-sm sm:min-w-[180px] ${
                      isLocked
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                        : "border-zinc-800 bg-zinc-950/70 text-white"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Deadline
                    </div>
                    <div className="mt-1 font-semibold">{formattedLockAt}</div>
                  </div>
                ) : null}
              </div>

              {isLocked ? (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Bonusvragen zijn gelockt.
                </div>
              ) : null}

              {!formattedLockAt ? (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Er is nog geen eerste WK wedstrijd gevonden.
                </div>
              ) : null}
            </div>

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
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5">
                <h2 className="text-lg font-semibold">
                  Er zijn nog geen bonusvragen aangemaakt
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Voeg eerst bonusvragen toe in de tabel{" "}
                  <span className="text-white">bonus_question_templates</span>.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
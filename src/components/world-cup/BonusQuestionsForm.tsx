"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type BonusQuestion = {
  id: string;
  questionKey: string;
  label: string;
  description: string | null;
  answerType: string;
  options: string[];
  pointsValue: number;
  initialAnswer: string;
};

type BonusQuestionsFormProps = {
  poolId: string;
  isLocked: boolean;
  questions: BonusQuestion[];
};

function getAnsweredCount(
  questions: BonusQuestion[],
  answers: Record<string, string>
) {
  return questions.filter((question) => answers[question.id]?.trim()).length;
}

function getQuestionLabel(question: BonusQuestion) {
  const key = question.questionKey.toLowerCase();

  if (
    key === "winner" ||
    key === "champion" ||
    key === "world_cup_winner" ||
    key === "tournament_winner"
  ) {
    return "Who will win the World Cup?";
  }

  if (
    key === "runner_up" ||
    key === "finalist" ||
    key === "losing_finalist" ||
    key === "second_place"
  ) {
    return "Who will finish as runner-up?";
  }

  if (
    key === "top_scorer" ||
    key === "golden_boot" ||
    key === "most_goals"
  ) {
    return "Which country will have the tournament top scorer?";
  }

  if (
    key === "best_player" ||
    key === "golden_ball" ||
    key === "player_of_the_tournament"
  ) {
    return "Which country will have the player of the tournament?";
  }

  if (
    key === "most_goals_team" ||
    key === "highest_scoring_team" ||
    key === "team_most_goals"
  ) {
    return "Which country will score the most goals?";
  }

  if (
    key === "fair_play" ||
    key === "fair_play_winner" ||
    key === "fairplay"
  ) {
    return "Which country will win the fair play award?";
  }

  return question.label;
}

function getQuestionDescription(question: BonusQuestion) {
  const key = question.questionKey.toLowerCase();

  if (
    key === "winner" ||
    key === "champion" ||
    key === "world_cup_winner" ||
    key === "tournament_winner"
  ) {
    return "Pick the country you think will lift the trophy.";
  }

  if (
    key === "runner_up" ||
    key === "finalist" ||
    key === "losing_finalist" ||
    key === "second_place"
  ) {
    return "Pick the country you think will lose the final.";
  }

  if (
    key === "top_scorer" ||
    key === "golden_boot" ||
    key === "most_goals"
  ) {
    return "Pick the country of the player you expect to finish as top scorer.";
  }

  if (
    key === "best_player" ||
    key === "golden_ball" ||
    key === "player_of_the_tournament"
  ) {
    return "Pick the country of the player you expect to be named player of the tournament.";
  }

  if (
    key === "most_goals_team" ||
    key === "highest_scoring_team" ||
    key === "team_most_goals"
  ) {
    return "Pick the country you expect to score the most goals across the tournament.";
  }

  if (
    key === "fair_play" ||
    key === "fair_play_winner" ||
    key === "fairplay"
  ) {
    return "Pick the country you expect to receive the fair play award.";
  }

  return question.description;
}

export default function BonusQuestionsForm({
  poolId,
  isLocked,
  questions,
}: BonusQuestionsFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      questions.map((question) => [question.id, question.initialAnswer ?? ""])
    )
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = getAnsweredCount(questions, answers);
  const allAnswered = answeredCount === questions.length;

  function updateAnswer(questionId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));

    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked) {
      setError(
        "Bonus answers are locked because the first World Cup match has started."
      );
      return;
    }

    const missingQuestion = questions.find(
      (question) => !answers[question.id]?.trim()
    );

    if (missingQuestion) {
      setError("Please answer all bonus questions before saving.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Your session could not be loaded. Please log in again.");
      setLoading(false);
      router.push("/auth");
      return;
    }

    const payload = questions.map((question) => ({
      pool_id: poolId,
      user_id: user.id,
      question_id: question.id,
      answer_value: answers[question.id],
    }));

    const { error: upsertError } = await supabase
      .from("bonus_question_answers")
      .upsert(payload, {
        onConflict: "pool_id,user_id,question_id",
      });

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    setMessage("Bonus answers saved.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Bonus predictions
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-zinc-400">
            These answers count toward your personal score in this pool.
          </p>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Progress
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {answeredCount} of {questions.length} answered
              </p>
            </div>

            <div
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                allAnswered
                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                  : "border-white/10 bg-white/[0.04] text-zinc-400"
              }`}
            >
              {allAnswered ? "Complete" : "Incomplete"}
            </div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-emerald-300 transition-all"
              style={{
                width:
                  questions.length > 0
                    ? `${Math.round((answeredCount / questions.length) * 100)}%`
                    : "0%",
              }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {questions.map((question) => {
            const hasAnswer = Boolean(answers[question.id]?.trim());
            const label = getQuestionLabel(question);
            const description = getQuestionDescription(question);

            return (
              <div
                key={question.id}
                className={`relative overflow-hidden rounded-2xl border p-4 transition sm:p-5 ${
                  hasAnswer
                    ? "border-emerald-300/25 bg-emerald-300/[0.06]"
                    : "border-white/10 bg-black/20 hover:border-emerald-300/25 hover:bg-white/[0.04]"
                }`}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-px ${
                    hasAnswer
                      ? "bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent"
                      : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  }`}
                />

                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                      Tournament prediction
                    </p>

                    <h3 className="mt-1 text-base font-black leading-snug text-white sm:text-lg">
                      {label}
                    </h3>
                  </div>

                  <div className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                    {question.pointsValue}{" "}
                    {question.pointsValue === 1 ? "pt" : "pts"}
                  </div>
                </div>

                {description ? (
                  <p className="mb-4 text-sm leading-6 text-zinc-400">
                    {description}
                  </p>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <select
                    value={answers[question.id] ?? ""}
                    onChange={(event) =>
                      updateAnswer(question.id, event.target.value)
                    }
                    disabled={isLocked || loading}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#06110d] px-4 text-sm font-bold text-white outline-none transition focus:border-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Choose a country</option>

                    {question.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <div
                    className={`rounded-xl border px-3 py-2 text-center text-xs font-black sm:min-w-[96px] ${
                      hasAnswer
                        ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.04] text-zinc-500"
                    }`}
                  >
                    {hasAnswer ? "Answered" : "Open"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm font-semibold text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-200">
          {message}
        </div>
      ) : null}

      <div className="sticky bottom-3 z-20 rounded-[1.5rem] border border-white/10 bg-[#030706]/90 p-3 shadow-2xl backdrop-blur-xl sm:static sm:flex sm:justify-center sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <button
          type="submit"
          disabled={isLocked || loading}
          className="w-full rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[220px]"
        >
          {isLocked
            ? "Locked"
            : loading
            ? "Saving..."
            : allAnswered
            ? "Save bonus answers"
            : "Complete all answers"}
        </button>
      </div>
    </form>
  );
}
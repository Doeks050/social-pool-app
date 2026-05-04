"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Language } from "@/lib/i18n";

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
  language: Language;
  questions: BonusQuestion[];
};

const copy = {
  en: {
    bonusPredictions: "Bonus predictions",
    pt: "pt",
    pts: "pts",
    chooseCountry: "Choose a country",
    open: "Open",
    locked: "Locked",
    saving: "Saving...",
    saveBonusAnswers: "Save bonus answers",
    completeAllAnswers: "Complete all answers",
    lockedError:
      "Bonus answers are locked because the first World Cup match has started.",
    missingError: "Please answer all bonus questions before saving.",
    sessionError: "Your session could not be loaded. Please log in again.",
    savedMessage: "Bonus answers saved.",
    winnerLabel: "Who will win the World Cup?",
    winnerDescription: "Pick the country you think will lift the trophy.",
    runnerUpLabel: "Who will finish as runner-up?",
    runnerUpDescription: "Pick the country you think will lose the final.",
    topScorerLabel: "Which country will have the tournament top scorer?",
    topScorerDescription:
      "Pick the country of the player you expect to finish as top scorer.",
    bestPlayerLabel: "Which country will have the player of the tournament?",
    bestPlayerDescription:
      "Pick the country of the player you expect to be named player of the tournament.",
    mostGoalsTeamLabel: "Which country will score the most goals?",
    mostGoalsTeamDescription:
      "Pick the country you expect to score the most goals across the tournament.",
    fairPlayLabel: "Which country will win the fair play award?",
    fairPlayDescription:
      "Pick the country you expect to receive the fair play award.",
  },
  nl: {
    bonusPredictions: "Bonusvoorspellingen",
    pt: "pt",
    pts: "ptn",
    chooseCountry: "Kies een land",
    open: "Open",
    locked: "Gesloten",
    saving: "Opslaan...",
    saveBonusAnswers: "Bonusantwoorden opslaan",
    completeAllAnswers: "Vul alle antwoorden in",
    lockedError:
      "Bonusantwoorden zijn gesloten omdat de eerste WK-wedstrijd is begonnen.",
    missingError: "Beantwoord eerst alle bonusvragen voordat je opslaat.",
    sessionError: "Je sessie kon niet worden geladen. Log opnieuw in.",
    savedMessage: "Bonusantwoorden opgeslagen.",
    winnerLabel: "Wie wint het WK?",
    winnerDescription: "Kies het land waarvan jij denkt dat het de beker wint.",
    runnerUpLabel: "Wie wordt tweede?",
    runnerUpDescription: "Kies het land waarvan jij denkt dat het de finale verliest.",
    topScorerLabel: "Welk land heeft de topscorer van het toernooi?",
    topScorerDescription:
      "Kies het land van de speler waarvan jij verwacht dat hij topscorer wordt.",
    bestPlayerLabel: "Welk land heeft de beste speler van het toernooi?",
    bestPlayerDescription:
      "Kies het land van de speler waarvan jij verwacht dat hij speler van het toernooi wordt.",
    mostGoalsTeamLabel: "Welk land maakt de meeste doelpunten?",
    mostGoalsTeamDescription:
      "Kies het land waarvan jij verwacht dat het de meeste doelpunten maakt tijdens het toernooi.",
    fairPlayLabel: "Welk land wint de fair play award?",
    fairPlayDescription:
      "Kies het land waarvan jij verwacht dat het de fair play award krijgt.",
  },
} satisfies Record<Language, Record<string, string>>;

function getAnsweredCount(
  questions: BonusQuestion[],
  answers: Record<string, string>
) {
  return questions.filter((question) => answers[question.id]?.trim()).length;
}

function getQuestionLabel(question: BonusQuestion, language: Language) {
  const t = copy[language];
  const key = question.questionKey.toLowerCase();

  if (
    key === "winner" ||
    key === "champion" ||
    key === "world_cup_winner" ||
    key === "tournament_winner"
  ) {
    return t.winnerLabel;
  }

  if (
    key === "runner_up" ||
    key === "finalist" ||
    key === "losing_finalist" ||
    key === "second_place"
  ) {
    return t.runnerUpLabel;
  }

  if (
    key === "top_scorer" ||
    key === "golden_boot" ||
    key === "most_goals"
  ) {
    return t.topScorerLabel;
  }

  if (
    key === "best_player" ||
    key === "golden_ball" ||
    key === "player_of_the_tournament"
  ) {
    return t.bestPlayerLabel;
  }

  if (
    key === "most_goals_team" ||
    key === "highest_scoring_team" ||
    key === "team_most_goals"
  ) {
    return t.mostGoalsTeamLabel;
  }

  if (
    key === "fair_play" ||
    key === "fair_play_winner" ||
    key === "fairplay"
  ) {
    return t.fairPlayLabel;
  }

  return question.label;
}

function getQuestionDescription(question: BonusQuestion, language: Language) {
  const t = copy[language];
  const key = question.questionKey.toLowerCase();

  if (
    key === "winner" ||
    key === "champion" ||
    key === "world_cup_winner" ||
    key === "tournament_winner"
  ) {
    return t.winnerDescription;
  }

  if (
    key === "runner_up" ||
    key === "finalist" ||
    key === "losing_finalist" ||
    key === "second_place"
  ) {
    return t.runnerUpDescription;
  }

  if (
    key === "top_scorer" ||
    key === "golden_boot" ||
    key === "most_goals"
  ) {
    return t.topScorerDescription;
  }

  if (
    key === "best_player" ||
    key === "golden_ball" ||
    key === "player_of_the_tournament"
  ) {
    return t.bestPlayerDescription;
  }

  if (
    key === "most_goals_team" ||
    key === "highest_scoring_team" ||
    key === "team_most_goals"
  ) {
    return t.mostGoalsTeamDescription;
  }

  if (
    key === "fair_play" ||
    key === "fair_play_winner" ||
    key === "fairplay"
  ) {
    return t.fairPlayDescription;
  }

  return question.description;
}

export default function BonusQuestionsForm({
  poolId,
  isLocked,
  language,
  questions,
}: BonusQuestionsFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const t = copy[language];

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
      setError(t.lockedError);
      return;
    }

    const missingQuestion = questions.find(
      (question) => !answers[question.id]?.trim()
    );

    if (missingQuestion) {
      setError(t.missingError);
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
      setError(t.sessionError);
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

    setMessage(t.savedMessage);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <section className="rounded-3xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl sm:p-5">
        <div className="mb-4">
          <h2 className="text-xl font-black tracking-tight text-emerald-300 sm:text-2xl">
            {t.bonusPredictions}
          </h2>
        </div>

        <div className="grid gap-3">
          {questions.map((question) => {
            const hasAnswer = Boolean(answers[question.id]?.trim());
            const label = getQuestionLabel(question, language);
            const description = getQuestionDescription(question, language);

            return (
              <div
                key={question.id}
                className={`relative overflow-hidden rounded-2xl border p-4 transition sm:p-5 ${
                  hasAnswer
                    ? "border-emerald-300/25 bg-emerald-300/6"
                    : "border-white/10 bg-black/20 hover:border-emerald-300/25 hover:bg-white/4"
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
                    <h3 className="text-base font-black leading-snug text-white sm:text-lg">
                      {label}
                    </h3>
                  </div>

                  <div className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                    {question.pointsValue}{" "}
                    {question.pointsValue === 1 ? t.pt : t.pts}
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
                    <option value="">{t.chooseCountry}</option>

                    {question.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <div
                    className={`rounded-xl border px-3 py-2 text-center text-xs font-black sm:min-w-24 ${
                      hasAnswer
                        ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                        : "border-white/10 bg-white/4 text-zinc-500"
                    }`}
                  >
                    {hasAnswer ? answeredCount > 0 && t.open ? t.open : t.open : t.open}
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

      <div className="sticky bottom-3 z-20 rounded-3xl border border-white/10 bg-[#030706]/90 p-3 shadow-2xl backdrop-blur-xl sm:static sm:flex sm:justify-center sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <button
          type="submit"
          disabled={isLocked || loading}
          className="w-full rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-56"
        >
          {isLocked
            ? t.locked
            : loading
            ? t.saving
            : allAnswered
            ? t.saveBonusAnswers
            : t.completeAllAnswers}
        </button>
      </div>
    </form>
  );
}
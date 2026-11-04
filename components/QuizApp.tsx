"use client";

import { useState, useTransition } from "react";
import { checkAnswer, createQuiz, type CheckAnswerResult } from "@/app/actions";
import { LEAGUE_LABELS, LEAGUE_SHORTCUTS, type LeagueShortcut } from "@/lib/openligadb/leagues";
import type { PublicQuestion } from "@/lib/quiz/session";

type ActiveQuiz = { leagueName: string; questions: PublicQuestion[]; token: string };
type Feedback = Extract<CheckAnswerResult, { ok: true }> & { selected: number };

const COUNT_CHOICES = [3, 5, 10];

export default function QuizApp() {
  // Zustand der Komponente. Jeder Aufruf eines set...-Befehls rendert die Komponente neu.
  const [league, setLeague] = useState<LeagueShortcut>("bl1");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState<ActiveQuiz | null>(null);
  const [current, setCurrent] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // isPending ist true, solange eine Server Action läuft → Buttons sperren, Ladeanzeige
  const [isPending, startTransition] = useTransition();

  function startQuiz() {
    setError(null);
    startTransition(async () => {
      const result = await createQuiz({ league, count }); // läuft auf dem Server
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setQuiz({ leagueName: result.leagueName, questions: result.questions, token: result.token });
      setCurrent(0);
      setScore(0);
      setFeedback(null);
    });
  }

  function answer(selected: number) {
    if (!quiz || feedback || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await checkAnswer({ token: quiz.token, questionIndex: current, answer: selected });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFeedback({ ...result, selected });
      if (result.correct) setScore((s) => s + 1);
    });
  }

  function next() {
    setFeedback(null);
    setCurrent((c) => c + 1);
  }

  function reset() {
    setQuiz(null);
    setError(null);
  }

  // ---------- Startbildschirm ----------
  if (!quiz) {
    return (
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold">Neues Quiz</h2>

        <p className="mt-4 text-sm font-medium text-slate-600">Liga</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEAGUE_SHORTCUTS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLeague(l)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                l === league ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-300"
              }`}
            >
              {LEAGUE_LABELS[l]}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-medium text-slate-600">Anzahl Fragen</p>
        <div className="mt-2 flex gap-2">
          {COUNT_CHOICES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCount(c)}
              className={`w-12 rounded-lg py-1.5 text-sm font-medium ${
                c === count ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={startQuiz}
          disabled={isPending}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isPending ? "Fragen werden erstellt …" : "Quiz erstellen"}
        </button>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>
    );
  }

  // ---------- Ergebnis ----------
  if (current >= quiz.questions.length) {
    return (
      <section className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">{quiz.leagueName}</p>
        <p className="mt-2 text-4xl font-bold">
          {score} / {quiz.questions.length}
        </p>
        <p className="mt-1 text-slate-600">richtig beantwortet</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-slate-900 px-6 py-2.5 font-semibold text-white"
        >
          Neues Quiz
        </button>
      </section>
    );
  }

  // ---------- Frage ----------
  const q = quiz.questions[current];
  const isLast = current === quiz.questions.length - 1;

  return (
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex justify-between text-sm text-slate-500">
        <span>
          {quiz.leagueName} · Frage {current + 1} von {quiz.questions.length}
        </span>
        <span>{score} richtig</span>
      </div>

      <h2 className="mt-3 text-lg font-semibold">{q.question}</h2>

      <div className="mt-4 grid gap-2">
        {q.options.map((option, i) => {
          let style = "bg-white ring-1 ring-slate-300 hover:bg-slate-50";
          if (feedback) {
            if (i === feedback.correctIndex) style = "bg-emerald-50 ring-2 ring-emerald-500";
            else if (i === feedback.selected) style = "bg-red-50 ring-2 ring-red-400";
            else style = "bg-white ring-1 ring-slate-200 opacity-60";
          }
          return (
            <button
              key={option}
              type="button"
              onClick={() => answer(i)}
              disabled={!!feedback || isPending}
              className={`rounded-lg px-4 py-3 text-left ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
          <p className={`font-semibold ${feedback.correct ? "text-emerald-700" : "text-red-700"}`}>
            {feedback.correct ? "Richtig!" : "Leider falsch."}
          </p>
          <p className="mt-1">{feedback.explanation}</p>
          <p className="mt-2 text-slate-500">Beleg aus den Daten: {feedback.evidence}</p>
          <button
            type="button"
            onClick={next}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white"
          >
            {isLast ? "Ergebnis anzeigen" : "Weiter"}
          </button>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}

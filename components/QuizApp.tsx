"use client";

import { useState, useTransition } from "react";
import { checkAnswer, createQuiz, type CheckAnswerResult } from "@/app/actions";
import {
  LEAGUE_LABELS,
  LEAGUE_SHORTCUTS,
  LEAGUE_TEAM_COUNT,
  type LeagueShortcut,
} from "@/lib/openligadb/leagues";
import type { PublicQuestion } from "@/lib/quiz/session";

type ActiveQuiz = { leagueName: string; questions: PublicQuestion[]; token: string };
type Feedback = Extract<CheckAnswerResult, { ok: true }> & { selected: number };

const COUNT_CHOICES = [3, 5, 10];

const CHALK_PANEL = "on-chalk rounded-2xl bg-chalk p-6 text-ink shadow-2xl shadow-black/30 sm:p-8";
const PRIMARY_BUTTON =
  "rounded-lg bg-pitch-800 px-8 py-3 font-display text-xl font-semibold text-chalk transition-colors hover:bg-pitch-700 disabled:cursor-wait disabled:opacity-70";

export default function QuizApp() {
  // Zustand der Komponente. Jeder Aufruf eines set...-Befehls rendert die Komponente neu.
  const [league, setLeague] = useState<LeagueShortcut>("bl1");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState<ActiveQuiz | null>(null);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<boolean[]>([]); // je beantworteter Frage: richtig/falsch
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  // isPending ist true, solange eine Server Action läuft → Buttons sperren, Ladeanzeige
  const [isPending, startTransition] = useTransition();

  // Abgeleitete Werte: werden bei jedem Rendern aus dem Zustand berechnet, nicht extra gespeichert
  const correct = results.filter(Boolean).length;
  const wrong = results.length - correct;

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
      setResults([]);
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
      setResults((r) => [...r, result.correct]);
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
      <section className={`mt-10 ${CHALK_PANEL}`}>
        <fieldset>
          <legend className="font-display text-2xl font-semibold">Welche Liga?</legend>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {LEAGUE_SHORTCUTS.map((l) => (
              <ChoiceTile
                key={l}
                name="league"
                checked={l === league}
                onSelect={() => setLeague(l)}
                title={LEAGUE_LABELS[l]}
                detail={`${LEAGUE_TEAM_COUNT[l]} Teams`}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="font-display text-2xl font-semibold">Wie viele Fragen?</legend>
          <div className="mt-3 grid max-w-xs grid-cols-3 gap-2">
            {COUNT_CHOICES.map((c) => (
              <ChoiceTile
                key={c}
                name="count"
                checked={c === count}
                onSelect={() => setCount(c)}
                title={String(c)}
                center
              />
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={startQuiz}
          disabled={isPending}
          className={`mt-8 w-full ${PRIMARY_BUTTON}`}
        >
          {isPending ? "Fragen werden erstellt …" : "Quiz erstellen"}
        </button>

        {isPending && <LoadingBall />}
        {error && <ErrorNote message={error} />}
      </section>
    );
  }

  const total = quiz.questions.length;

  // ---------- Endstand ----------
  if (current >= total) {
    const outcome = correct > wrong ? "Sieg" : correct === wrong ? "Unentschieden" : "Niederlage";
    return (
      <section className="mt-10 overflow-hidden rounded-2xl bg-pitch-950 text-center shadow-2xl shadow-black/30 ring-1 ring-white/10">
        <div className="px-6 py-10">
          <p className="text-lg text-chalk-dim">Endstand {quiz.leagueName}</p>
          <p
            className="mt-3 font-display text-8xl font-bold leading-none tabular-nums text-flood"
            aria-label={`${correct} richtig, ${wrong} falsch`}
          >
            {correct}
            <span className="mx-3 text-chalk-dim">:</span>
            {wrong}
          </p>
          <div className="mx-auto mt-2 flex max-w-44 justify-between text-sm text-chalk-dim" aria-hidden>
            <span>richtig</span>
            <span>falsch</span>
          </div>
          <p className="mt-8 font-display text-4xl font-semibold text-chalk">{outcome}</p>
          <p className="mt-1 text-chalk-dim">
            {correct} von {total} Fragen richtig beantwortet.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 bg-pitch-900 p-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={startQuiz}
            disabled={isPending}
            className="rounded-lg bg-flood px-6 py-3 font-display text-xl font-semibold text-ink transition-colors hover:bg-flood-dim disabled:cursor-wait disabled:opacity-70"
          >
            {isPending ? "Fragen werden erstellt …" : `Neues Quiz: ${LEAGUE_LABELS[league]}`}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={isPending}
            className="rounded-lg px-6 py-3 font-display text-xl font-semibold text-chalk ring-1 ring-white/25 transition-colors hover:bg-white/5"
          >
            Andere Liga wählen
          </button>
        </div>
        {error && (
          <div className="p-4 pt-0">
            <ErrorNote message={error} onDark />
          </div>
        )}
      </section>
    );
  }

  // ---------- Frage ----------
  const q = quiz.questions[current];
  const isLast = current === total - 1;

  return (
    <>
      <Scoreboard
        leagueName={quiz.leagueName}
        current={current}
        total={total}
        correct={correct}
        wrong={wrong}
      />
      <Progress total={total} current={current} results={results} />

      <section className={`mt-4 ${CHALK_PANEL}`}>
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight">{q.question}</h2>

        <div className="mt-6 grid gap-2.5">
          {q.options.map((option, i) => {
            const isCorrect = feedback?.correctIndex === i;
            const isWrongPick = !!feedback && feedback.selected === i && !feedback.correct;

            let style = "border-ink/10 bg-white hover:border-pitch-700";
            if (feedback) {
              if (isCorrect) style = "border-hit bg-hit/10";
              else if (isWrongPick) style = "border-goal bg-goal/10";
              else style = "border-ink/10 bg-white opacity-50";
            }

            return (
              <button
                key={option}
                type="button"
                onClick={() => answer(i)}
                disabled={!!feedback || isPending}
                className={`flex items-center justify-between gap-3 rounded-lg border-2 px-4 py-3.5 text-left text-lg font-medium transition-colors disabled:cursor-default ${style}`}
              >
                <span>{option}</span>
                {/* Text zusätzlich zur Farbe, damit es auch ohne Farbsehen eindeutig ist */}
                {feedback && isCorrect && (
                  <span className="shrink-0 text-sm font-semibold text-hit-ink">Richtige Antwort</span>
                )}
                {isWrongPick && <span className="shrink-0 text-sm font-semibold text-goal-ink">Deine Antwort</span>}
              </button>
            );
          })}
        </div>

        {isPending && !feedback && <p className="mt-4 text-sm text-ink/60">Antwort wird geprüft …</p>}

        {feedback && (
          <div aria-live="polite">
            <div className={`mt-6 border-l-4 pl-4 ${feedback.correct ? "border-hit" : "border-goal"}`}>
              <p
                className={`font-display text-2xl font-semibold ${
                  feedback.correct ? "text-hit-ink" : "text-goal-ink"
                }`}
              >
                {feedback.correct ? "Richtig." : "Falsch."}
              </p>
              <p className="mt-1 text-ink/85">{feedback.explanation}</p>
              <p className="mt-3 text-sm text-ink/60">
                <span className="font-semibold">Beleg aus den Daten:</span> {feedback.evidence}
              </p>
            </div>
            <button type="button" onClick={next} autoFocus className={`mt-6 w-full sm:w-auto ${PRIMARY_BUTTON}`}>
              {isLast ? "Zum Endstand" : "Nächste Frage"}
            </button>
          </div>
        )}

        {error && <ErrorNote message={error} />}
      </section>
    </>
  );
}

/*
 * Kleine Hilfskomponenten. Sie stehen außerhalb von QuizApp: Innerhalb definiert,
 * würde React sie bei jedem Rendern als neue Komponente ansehen und neu aufbauen.
 */

function ChoiceTile(props: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail?: string;
  center?: boolean;
}) {
  // Echte Radio-Buttons (unsichtbar) → Tastatur und Screenreader funktionieren automatisch
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={props.name}
        checked={props.checked}
        onChange={props.onSelect}
        className="peer sr-only"
      />
      <span
        className={`flex h-full flex-col rounded-lg border-2 border-ink/10 bg-white px-3 py-3 transition-colors hover:border-ink/30 peer-checked:border-pitch-800 peer-checked:bg-pitch-800 peer-checked:text-chalk peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pitch-700 ${
          props.center ? "items-center" : ""
        }`}
      >
        <span className="font-display text-2xl font-semibold leading-tight">{props.title}</span>
        {props.detail && <span className="mt-0.5 text-sm opacity-70">{props.detail}</span>}
      </span>
    </label>
  );
}

function Scoreboard(props: {
  leagueName: string;
  current: number;
  total: number;
  correct: number;
  wrong: number;
}) {
  return (
    <div className="mt-10 flex items-end justify-between gap-4">
      <div>
        <p className="font-display text-2xl font-semibold text-chalk">{props.leagueName}</p>
        <p className="text-chalk-dim">
          Frage {props.current + 1} von {props.total}
        </p>
      </div>
      <div
        className="rounded-lg bg-pitch-950 px-4 py-2 text-center ring-1 ring-white/10"
        aria-label={`Spielstand: ${props.correct} richtig, ${props.wrong} falsch`}
      >
        <p className="font-display text-4xl font-bold leading-none tabular-nums text-flood">
          {props.correct}
          <span className="mx-1.5 text-chalk-dim">:</span>
          {props.wrong}
        </p>
        <div className="mt-1 flex justify-between gap-4 text-xs text-chalk-dim" aria-hidden>
          <span>richtig</span>
          <span>falsch</span>
        </div>
      </div>
    </div>
  );
}

function Progress(props: { total: number; current: number; results: boolean[] }) {
  return (
    <ol className="mt-4 flex gap-1.5" aria-hidden>
      {Array.from({ length: props.total }, (_, i) => {
        let color = "bg-pitch-700"; // noch offen
        if (i < props.results.length) color = props.results[i] ? "bg-hit" : "bg-goal";
        else if (i === props.current) color = "bg-flood";
        return <li key={i} className={`h-1.5 flex-1 rounded-full ${color}`} />;
      })}
    </ol>
  );
}

function LoadingBall() {
  return (
    <div className="mt-6" role="status">
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-ink/15" />
        <div className="ball absolute top-0 size-4 rounded-full border-2 border-ink bg-white" />
      </div>
      <p className="mt-3 text-sm text-ink/70">
        Die KI liest Tabelle und Ergebnisse. Das dauert ein paar Sekunden.
      </p>
    </div>
  );
}

function ErrorNote({ message, onDark = false }: { message: string; onDark?: boolean }) {
  return (
    <p
      role="alert"
      className={`mt-4 rounded-lg border-l-4 border-goal bg-goal/10 p-3 text-sm ${
        onDark ? "text-chalk" : "text-goal-ink"
      }`}
    >
      {message}
    </p>
  );
}

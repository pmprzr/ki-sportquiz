"use server";

import { z } from "zod";
import { getLeagueSnapshot } from "@/lib/openligadb/client";
import { LEAGUE_SHORTCUTS } from "@/lib/openligadb/leagues";
import { generateQuiz } from "@/lib/quiz/generate";
import { OPTION_COUNT, QUESTION_COUNT_MAX, QUESTION_COUNT_MIN } from "@/lib/quiz/schema";
import { readAnswerKey, splitQuiz, type PublicQuestion } from "@/lib/quiz/session";
import { MIN_SECRET_LENGTH } from "@/lib/quiz/token";

/*
 * Server Actions: Funktionen, die nur auf dem Server laufen, aber vom Client aus aufgerufen werden.
 * Next.js macht daraus intern einen POST-Endpunkt. Jeder kann ihn mit beliebigen Daten aufrufen,
 * deshalb ist der Parameter "unknown" und wird mit zod geprüft – TypeScript-Typen schützen hier nicht.
 */

function getSecret(): string {
  const secret = process.env.QUIZ_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`QUIZ_SECRET fehlt oder ist kürzer als ${MIN_SECRET_LENGTH} Zeichen (.env.local)`);
  }
  return secret;
}

const createQuizInput = z.object({
  league: z.enum(LEAGUE_SHORTCUTS),
  count: z.number().int().min(QUESTION_COUNT_MIN).max(QUESTION_COUNT_MAX),
});

export type CreateQuizResult =
  | { ok: true; leagueName: string; questions: PublicQuestion[]; token: string }
  | { ok: false; error: string };

export async function createQuiz(input: unknown): Promise<CreateQuizResult> {
  const parsed = createQuizInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  try {
    const snapshot = await getLeagueSnapshot(parsed.data.league);
    const quiz = await generateQuiz(snapshot, parsed.data.count);
    const { questions, token } = splitQuiz(quiz, getSecret(), Date.now());
    return { ok: true, leagueName: snapshot.leagueName, questions, token };
  } catch (err) {
    console.error(err); // Details nur ins Server-Log
    return { ok: false, error: "Das Quiz konnte nicht erstellt werden. Bitte versuche es erneut." };
  }
}

const checkAnswerInput = z.object({
  token: z.string().min(1).max(20_000),
  questionIndex: z.number().int().min(0).max(QUESTION_COUNT_MAX - 1),
  answer: z.number().int().min(0).max(OPTION_COUNT - 1),
});

export type CheckAnswerResult =
  | { ok: true; correct: boolean; correctIndex: number; explanation: string; evidence: string }
  | { ok: false; error: string };

export async function checkAnswer(input: unknown): Promise<CheckAnswerResult> {
  const parsed = checkAnswerInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  try {
    const key = readAnswerKey(parsed.data.token, getSecret(), Date.now());
    if (!key) return { ok: false, error: "Das Quiz ist abgelaufen. Bitte starte ein neues." };

    const item = key.answers[parsed.data.questionIndex];
    if (!item) return { ok: false, error: "Unbekannte Frage." };

    return { ok: true, correct: parsed.data.answer === item.correctIndex, ...item };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Die Antwort konnte nicht geprüft werden." };
  }
}

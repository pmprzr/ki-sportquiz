import { z } from "zod";
import { OPTION_COUNT, type Quiz } from "./schema";
import { seal, unseal } from "./token";

export const QUIZ_TTL_MS = 2 * 60 * 60 * 1000; // ein Quiz ist 2 Stunden gültig

/** Was der Browser sehen darf: Frage und Antwortmöglichkeiten, aber keine Lösung. */
export type PublicQuestion = { question: string; options: string[] };

/** Was nur verschlüsselt im Token steht. */
const answerKeySchema = z.object({
  v: z.literal(1),
  exp: z.number().int(),
  answers: z.array(
    z.object({
      correctIndex: z.number().int().min(0).max(OPTION_COUNT - 1),
      explanation: z.string(),
      evidence: z.string(),
    }),
  ),
});
export type AnswerKey = z.infer<typeof answerKeySchema>;

/** Teilt ein Quiz in den öffentlichen Teil und den verschlüsselten Lösungsschlüssel. */
export function splitQuiz(
  quiz: Quiz,
  secret: string,
  now: number,
): { questions: PublicQuestion[]; token: string } {
  const key: AnswerKey = {
    v: 1,
    exp: now + QUIZ_TTL_MS,
    answers: quiz.questions.map((q) => ({
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      evidence: q.evidence,
    })),
  };
  return {
    questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
    token: seal(key, secret),
  };
}

/** Liefert den Lösungsschlüssel oder null (ungültig, manipuliert oder abgelaufen). */
export function readAnswerKey(token: string, secret: string, now: number): AnswerKey | null {
  const parsed = answerKeySchema.safeParse(unseal(token, secret));
  if (!parsed.success || parsed.data.exp < now) return null;
  return parsed.data;
}

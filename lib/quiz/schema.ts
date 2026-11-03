import { z } from "zod";

export const QUESTION_COUNT_MIN = 3;
export const QUESTION_COUNT_MAX = 10;
export const OPTION_COUNT = 4;

/** Laufzeitprüfung der Modellantwort. Strenger als das JSON-Schema für OpenAI (Längen, Eindeutigkeit). */
export const questionSchema = z
  .object({
    question: z.string().trim().min(10).max(300),
    options: z.array(z.string().trim().min(1).max(100)).length(OPTION_COUNT),
    correctIndex: z.number().int().min(0).max(OPTION_COUNT - 1),
    explanation: z.string().trim().min(1).max(400),
    evidence: z.string().trim().min(1).max(300),
  })
  .refine((q) => new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length, {
    message: "Antwortmöglichkeiten müssen verschieden sein",
    path: ["options"],
  });

export const quizSchema = z.object({
  questions: z.array(questionSchema).min(QUESTION_COUNT_MIN).max(QUESTION_COUNT_MAX),
});

export type QuizQuestion = z.infer<typeof questionSchema>;
export type Quiz = z.infer<typeof quizSchema>;

/**
 * JSON-Schema für die strukturierte Ausgabe von OpenAI (strict mode).
 * Bewusst von Hand geschrieben, damit genau sichtbar ist, was an die API geht.
 * Strict mode verlangt: alle Felder in "required", additionalProperties: false.
 */
export const quizJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "options", "correctIndex", "explanation", "evidence"],
        properties: {
          question: { type: "string", description: "Die Quizfrage auf Deutsch" },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Genau 4 verschiedene Antwortmöglichkeiten",
          },
          correctIndex: { type: "integer", description: "Index (0 bis 3) der richtigen Antwort" },
          explanation: { type: "string", description: "Kurze Erklärung der richtigen Antwort" },
          evidence: {
            type: "string",
            description: "Die konkreten Werte aus den Daten, die die richtige Antwort belegen",
          },
        },
      },
    },
  },
};

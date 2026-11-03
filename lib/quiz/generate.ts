import "server-only";
import OpenAI from "openai";
import type { LeagueSnapshot } from "../openligadb/types";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { quizJsonSchema, quizSchema, type Quiz } from "./schema";
import { shuffleOptions } from "./shuffle";

const DEFAULT_MODEL = "gpt-4.1-mini";

export class QuizGenerationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "QuizGenerationError";
  }
}

// Ein Client pro Serverprozess, erst beim ersten Aufruf erzeugt
let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-...") {
    throw new QuizGenerationError("OPENAI_API_KEY fehlt in .env.local");
  }
  client ??= new OpenAI({ apiKey, timeout: 60_000, maxRetries: 2 });
  return client;
}

export async function generateQuiz(snapshot: LeagueSnapshot, count: number): Promise<Quiz> {
  const response = await getClient().responses.create({
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    instructions: SYSTEM_PROMPT,
    input: buildUserPrompt(snapshot, count),
    text: {
      format: { type: "json_schema", name: "quiz", schema: quizJsonSchema, strict: true },
    },
  });

  const raw = response.output_text;
  if (!raw) {
    throw new QuizGenerationError("Leere Antwort vom Modell");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new QuizGenerationError("Antwort ist kein gültiges JSON", { cause: err });
  }

  // Zweite Prüfung: Das JSON-Schema garantiert die Form, zod zusätzlich Inhalt und Grenzen
  const parsed = quizSchema.safeParse(json);
  if (!parsed.success) {
    throw new QuizGenerationError("Antwort entspricht nicht dem Quiz-Schema", {
      cause: parsed.error,
    });
  }

  return { questions: parsed.data.questions.map((q) => shuffleOptions(q)) };
}

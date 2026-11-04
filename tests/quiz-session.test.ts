import { describe, expect, it } from "vitest";
import type { Quiz } from "../lib/quiz/schema";
import { QUIZ_TTL_MS, readAnswerKey, splitQuiz } from "../lib/quiz/session";
import { seal, unseal } from "../lib/quiz/token";

const SECRET = "test-secret-mit-mindestens-32-zeichen!!";
const OTHER_SECRET = "ein-ganz-anderes-secret-mit-32-zeichen!!";
const NOW = Date.UTC(2026, 10, 4, 12, 0, 0);

const quiz: Quiz = {
  questions: [
    {
      question: "Welches Team steht auf Platz 1?",
      options: ["A", "B", "C", "D"],
      correctIndex: 2,
      explanation: "C hat die meisten Punkte.",
      evidence: "Platz 1: C, 24 Punkte",
    },
  ],
};

describe("seal/unseal", () => {
  it("entschlüsselt, was verschlüsselt wurde", () => {
    expect(unseal(seal({ a: 1 }, SECRET), SECRET)).toEqual({ a: 1 });
  });

  it("lehnt ein anderes Secret ab", () => {
    expect(unseal(seal({ a: 1 }, SECRET), OTHER_SECRET)).toBeNull();
  });

  it("erkennt manipulierte Tokens", () => {
    const bytes = Buffer.from(seal({ a: 1 }, SECRET), "base64url");
    bytes[bytes.length - 1] ^= 0xff; // letztes Byte des verschlüsselten Inhalts verändern
    expect(unseal(bytes.toString("base64url"), SECRET)).toBeNull();
  });

  it("lehnt Unsinn ab", () => {
    expect(unseal("kein-token", SECRET)).toBeNull();
  });

  it("verlangt ein ausreichend langes Secret", () => {
    expect(() => seal({ a: 1 }, "zu-kurz")).toThrow();
  });
});

describe("splitQuiz/readAnswerKey", () => {
  it("gibt dem Browser keine Lösung mit", () => {
    const { questions, token } = splitQuiz(quiz, SECRET, NOW);
    expect(questions).toEqual([{ question: quiz.questions[0].question, options: ["A", "B", "C", "D"] }]);
    expect(JSON.stringify(questions)).not.toContain("correctIndex");
    expect(token).not.toContain("Punkte"); // Inhalt ist verschlüsselt
  });

  it("liest den Lösungsschlüssel wieder aus", () => {
    const { token } = splitQuiz(quiz, SECRET, NOW);
    expect(readAnswerKey(token, SECRET, NOW)?.answers[0].correctIndex).toBe(2);
  });

  it("lehnt abgelaufene Quizze ab", () => {
    const { token } = splitQuiz(quiz, SECRET, NOW);
    expect(readAnswerKey(token, SECRET, NOW + QUIZ_TTL_MS + 1)).toBeNull();
  });

  it("lehnt verschlüsselte Daten mit falscher Struktur ab", () => {
    expect(readAnswerKey(seal({ foo: "bar" }, SECRET), SECRET, NOW)).toBeNull();
  });
});

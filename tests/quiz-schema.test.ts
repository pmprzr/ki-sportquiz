import { describe, expect, it } from "vitest";
import { questionSchema, quizSchema } from "../lib/quiz/schema";

const validQuestion = {
  question: "Welches Team steht auf Platz 1 der Tabelle?",
  options: ["VfL Bochum", "FC Schalke 04", "Borussia Dortmund", "MSV Duisburg"],
  correctIndex: 0,
  explanation: "Der VfL Bochum hat die meisten Punkte.",
  evidence: "Platz 1: VfL Bochum, 24 Punkte",
};

describe("questionSchema", () => {
  it("akzeptiert eine gültige Frage", () => {
    expect(questionSchema.safeParse(validQuestion).success).toBe(true);
  });

  it("lehnt doppelte Antworten ab (auch bei anderer Groß-/Kleinschreibung)", () => {
    const q = { ...validQuestion, options: ["VfL Bochum", "vfl bochum", "A", "B"] };
    expect(questionSchema.safeParse(q).success).toBe(false);
  });

  it("verlangt genau 4 Antworten", () => {
    const q = { ...validQuestion, options: ["A", "B", "C"] };
    expect(questionSchema.safeParse(q).success).toBe(false);
  });

  it("lehnt einen ungültigen correctIndex ab", () => {
    expect(questionSchema.safeParse({ ...validQuestion, correctIndex: 4 }).success).toBe(false);
  });
});

describe("quizSchema", () => {
  it("verlangt mindestens 3 Fragen", () => {
    expect(quizSchema.safeParse({ questions: [validQuestion] }).success).toBe(false);
  });

  it("akzeptiert 3 gültige Fragen", () => {
    const quiz = { questions: [validQuestion, validQuestion, validQuestion] };
    expect(quizSchema.safeParse(quiz).success).toBe(true);
  });
});

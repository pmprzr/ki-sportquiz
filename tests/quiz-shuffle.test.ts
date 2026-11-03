import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "../lib/quiz/schema";
import { shuffleOptions } from "../lib/quiz/shuffle";

const question: QuizQuestion = {
  question: "Welches Team steht auf Platz 1?",
  options: ["A", "B", "C", "D"],
  correctIndex: 0,
  explanation: "…",
  evidence: "…",
};

/** Liefert nacheinander die übergebenen Werte – macht den Zufall im Test vorhersagbar. */
function sequence(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("shuffleOptions", () => {
  it("behält dieselben Antworten und die richtige Antwort", () => {
    const shuffled = shuffleOptions(question, sequence(0.1, 0.9, 0.5));
    expect([...shuffled.options].sort()).toEqual(["A", "B", "C", "D"]);
    expect(shuffled.options[shuffled.correctIndex]).toBe("A");
  });

  it("verschiebt die richtige Antwort", () => {
    const shuffled = shuffleOptions(question, sequence(0)); // tauscht immer mit Index 0
    expect(shuffled.correctIndex).not.toBe(0);
  });

  it("verändert die ursprüngliche Frage nicht", () => {
    shuffleOptions(question, sequence(0));
    expect(question.options).toEqual(["A", "B", "C", "D"]);
  });
});

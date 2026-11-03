import type { QuizQuestion } from "./schema";

/**
 * Mischt die Antwortmöglichkeiten (Fisher-Yates) und passt correctIndex an.
 * Hintergrund: Sprachmodelle setzen die richtige Antwort auffällig oft an dieselbe Stelle.
 * random ist ein Parameter, damit der Test eine feste Zufallsfolge übergeben kann.
 */
export function shuffleOptions(q: QuizQuestion, random: () => number = Math.random): QuizQuestion {
  const correct = q.options[q.correctIndex];
  const options = [...q.options];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { ...q, options, correctIndex: options.indexOf(correct) };
}

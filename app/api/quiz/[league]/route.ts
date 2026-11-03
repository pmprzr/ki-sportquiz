import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { getLeagueSnapshot, OpenLigaDbError } from "@/lib/openligadb/client";
import { LEAGUE_SHORTCUTS } from "@/lib/openligadb/leagues";
import { generateQuiz, QuizGenerationError } from "@/lib/quiz/generate";
import { QUESTION_COUNT_MAX, QUESTION_COUNT_MIN } from "@/lib/quiz/schema";

const paramsSchema = z.object({ league: z.enum(LEAGUE_SHORTCUTS) });
const countSchema = z.coerce.number().int().min(QUESTION_COUNT_MIN).max(QUESTION_COUNT_MAX).catch(5);

// GET /api/quiz/bl1?anzahl=5 – nur zum Testen in der Entwicklung.
// Jeder Aufruf kostet Geld, deshalb ist der Endpunkt in Produktion abgeschaltet.
export async function GET(request: Request, { params }: { params: Promise<{ league: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Unbekannte Liga. Erlaubt: ${LEAGUE_SHORTCUTS.join(", ")}` },
      { status: 400 },
    );
  }
  const count = countSchema.parse(new URL(request.url).searchParams.get("anzahl") ?? undefined);

  try {
    const snapshot = await getLeagueSnapshot(parsed.data.league);
    const quiz = await generateQuiz(snapshot, count);
    return NextResponse.json(quiz);
  } catch (err) {
    console.error(err); // Details nur ins Server-Log
    const external =
      err instanceof OpenLigaDbError ||
      err instanceof QuizGenerationError ||
      err instanceof OpenAI.APIError;
    return NextResponse.json(
      { error: "Quiz konnte nicht erstellt werden." },
      { status: external ? 502 : 500 },
    );
  }
}

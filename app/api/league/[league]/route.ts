import { NextResponse } from "next/server";
import { z } from "zod";
import { getLeagueSnapshot, OpenLigaDbError } from "@/lib/openligadb/client";
import { LEAGUE_SHORTCUTS } from "@/lib/openligadb/leagues";

const paramsSchema = z.object({ league: z.enum(LEAGUE_SHORTCUTS) });

// GET /api/league/bl1 → Tabelle + letzte Ergebnisse als JSON (Test-/Debug-Endpunkt)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ league: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Unbekannte Liga. Erlaubt: ${LEAGUE_SHORTCUTS.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const snapshot = await getLeagueSnapshot(parsed.data.league);
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error(err); // Details nur ins Server-Log
    const status = err instanceof OpenLigaDbError ? 502 : 500;
    return NextResponse.json({ error: "Ligadaten konnten nicht geladen werden." }, { status });
  }
}

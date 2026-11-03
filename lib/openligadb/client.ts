import "server-only";
import type { z } from "zod";
import { getCurrentSeason, LEAGUE_LABELS, type LeagueShortcut } from "./leagues";
import { toRecentResults, toStandings } from "./mappers";
import { currentGroupSchema, matchListSchema, tableSchema } from "./schemas";
import type { LeagueSnapshot, MatchResult, Standing } from "./types";

const BASE_URL = "https://api.openligadb.de";
const REVALIDATE_SECONDS = 300; // 5 Minuten Cache
const TIMEOUT_MS = 8000;

export class OpenLigaDbError extends Error {
  readonly status?: number;
  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "OpenLigaDbError";
    this.status = options?.status;
  }
}

/** Zentrale Stelle für Netzwerk, Statuscode und Validierung. Rückgabetyp folgt aus dem Schema. */
async function fetchJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch (err) {
    throw new OpenLigaDbError(`OpenLigaDB nicht erreichbar: ${path}`, { cause: err });
  }

  if (!res.ok) {
    throw new OpenLigaDbError(`OpenLigaDB antwortete mit ${res.status}: ${path}`, {
      status: res.status,
    });
  }

  const json: unknown = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new OpenLigaDbError(`Unerwartetes Datenformat: ${path}`, { cause: parsed.error });
  }
  return parsed.data;
}

export async function getStandings(
  league: LeagueShortcut,
  season = getCurrentSeason(),
): Promise<Standing[]> {
  const rows = await fetchJson(`/getbltable/${league}/${season}`, tableSchema);
  return toStandings(rows);
}

export async function getRecentResults(
  league: LeagueShortcut,
  season = getCurrentSeason(),
  limit = 10,
): Promise<MatchResult[]> {
  const current = await fetchJson(`/getcurrentgroup/${league}`, currentGroupSchema);

  // Aktueller Spieltag ist evtl. noch nicht fertig → Vorspieltag mitnehmen
  const matchdays = [current.groupOrderID, current.groupOrderID - 1].filter((d) => d >= 1);

  const lists = await Promise.all(
    matchdays.map((d) => fetchJson(`/getmatchdata/${league}/${season}/${d}`, matchListSchema)),
  );
  return toRecentResults(lists.flat(), limit);
}

export async function getLeagueSnapshot(league: LeagueShortcut): Promise<LeagueSnapshot> {
  const season = getCurrentSeason();
  const [standings, recentResults] = await Promise.all([
    getStandings(league, season),
    getRecentResults(league, season),
  ]);

  return {
    league,
    leagueName: LEAGUE_LABELS[league],
    season,
    fetchedAt: new Date().toISOString(),
    standings,
    recentResults,
  };
}

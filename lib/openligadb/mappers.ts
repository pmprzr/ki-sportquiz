import type { RawMatch, RawTableRow } from "./schemas";
import type { MatchResult, Standing } from "./types";

const FINAL_RESULT_TYPE = 2;

export function toStandings(rows: RawTableRow[]): Standing[] {
  // Die API liefert die Tabelle bereits sortiert → Position = Index + 1
  return rows.map((r, i) => ({
    position: i + 1,
    team: r.teamName,
    played: r.matches,
    won: r.won,
    draw: r.draw,
    lost: r.lost,
    goalsFor: r.goals,
    goalsAgainst: r.opponentGoals,
    goalDiff: r.goalDiff,
    points: r.points,
  }));
}

/** Liefert null für Spiele ohne Endergebnis – das Modell soll nie aus unfertigen Spielen fragen. */
export function toMatchResult(m: RawMatch): MatchResult | null {
  const final = m.matchResults.find((r) => r.resultTypeID === FINAL_RESULT_TYPE);
  if (!m.matchIsFinished || !final) return null;

  return {
    matchday: m.group.groupOrderID,
    kickoffUtc: m.matchDateTimeUTC,
    home: m.team1.teamName,
    away: m.team2.teamName,
    homeGoals: final.pointsTeam1,
    awayGoals: final.pointsTeam2,
  };
}

export function toRecentResults(matches: RawMatch[], limit: number): MatchResult[] {
  return matches
    .map(toMatchResult)
    .filter((m): m is MatchResult => m !== null) // Type Guard: danach kein null mehr
    .sort((a, b) => b.kickoffUtc.localeCompare(a.kickoffUtc)) // neueste zuerst
    .slice(0, limit);
}

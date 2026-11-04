/** Whitelist der erlaubten Ligen – einzige Quelle für Typ UND Laufzeitprüfung. */
export const LEAGUE_SHORTCUTS = ["bl1", "bl2", "bl3"] as const;

export type LeagueShortcut = (typeof LEAGUE_SHORTCUTS)[number];

export const LEAGUE_LABELS: Record<LeagueShortcut, string> = {
  bl1: "1. Bundesliga",
  bl2: "2. Bundesliga",
  bl3: "3. Liga",
};

export const LEAGUE_TEAM_COUNT: Record<LeagueShortcut, number> = {
  bl1: 18,
  bl2: 18,
  bl3: 20,
};

/**
 * OpenLigaDB benennt eine Saison nach ihrem Startjahr (2026/27 → 2026).
 * Ab Juli zählt das laufende Jahr, davor das Vorjahr.
 * Das Datum ist ein Parameter, damit man im Test ein festes Datum übergeben kann.
 */
export function getCurrentSeason(now: Date = new Date()): number {
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1; // getMonth(): 0 = Januar
}

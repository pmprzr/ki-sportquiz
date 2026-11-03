import type { LeagueShortcut } from "./leagues";

/** Unsere eigenen Domänentypen – unabhängig von der Struktur der OpenLigaDB-API. */

export type Standing = {
  position: number;
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type MatchResult = {
  matchday: number;
  kickoffUtc: string;
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
};

export type LeagueSnapshot = {
  league: LeagueShortcut;
  leagueName: string;
  season: number;
  fetchedAt: string;
  standings: Standing[];
  recentResults: MatchResult[];
};

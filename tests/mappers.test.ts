import { describe, expect, it } from "vitest";
import { toMatchResult, toRecentResults } from "../lib/openligadb/mappers";
import type { RawMatch } from "../lib/openligadb/schemas";

function match(overrides: Partial<RawMatch> = {}): RawMatch {
  return {
    matchID: 1,
    matchDateTimeUTC: "2026-11-01T14:30:00Z",
    matchIsFinished: true,
    group: { groupName: "10. Spieltag", groupOrderID: 10 },
    team1: { teamName: "Heim" },
    team2: { teamName: "Gast" },
    matchResults: [
      { resultTypeID: 1, pointsTeam1: 0, pointsTeam2: 1 }, // Halbzeit
      { resultTypeID: 2, pointsTeam1: 2, pointsTeam2: 1 }, // Endstand
    ],
    ...overrides,
  };
}

describe("toMatchResult", () => {
  it("nimmt den Endstand, nicht den Halbzeitstand", () => {
    expect(toMatchResult(match())).toMatchObject({ homeGoals: 2, awayGoals: 1 });
  });

  it("verwirft unfertige Spiele", () => {
    expect(toMatchResult(match({ matchIsFinished: false }))).toBeNull();
  });

  it("verwirft Spiele ohne Endergebnis", () => {
    expect(toMatchResult(match({ matchResults: [] }))).toBeNull();
  });
});

describe("toRecentResults", () => {
  it("sortiert neueste zuerst und begrenzt die Anzahl", () => {
    const result = toRecentResults(
      [
        match({ matchID: 1, matchDateTimeUTC: "2026-10-25T14:30:00Z" }),
        match({ matchID: 2, matchDateTimeUTC: "2026-11-01T14:30:00Z" }),
        match({ matchID: 3, matchDateTimeUTC: "2026-10-31T19:30:00Z" }),
        match({ matchID: 4, matchIsFinished: false }),
      ],
      2,
    );
    expect(result.map((r) => r.kickoffUtc)).toEqual([
      "2026-11-01T14:30:00Z",
      "2026-10-31T19:30:00Z",
    ]);
  });
});

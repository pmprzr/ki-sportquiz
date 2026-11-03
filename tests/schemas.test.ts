import { describe, expect, it } from "vitest";
import { matchSchema, tableRowSchema } from "../lib/openligadb/schemas";

const validRow = {
  teamName: "VfL Bochum",
  points: 20,
  matches: 10,
  won: 6,
  draw: 2,
  lost: 2,
  goals: 18,
  opponentGoals: 10,
  goalDiff: 8,
};

describe("tableRowSchema", () => {
  it("entfernt unbekannte Felder (Whitelist)", () => {
    const parsed = tableRowSchema.parse({ ...validRow, teamIconUrl: "https://x/y.png" });
    expect(parsed).not.toHaveProperty("teamIconUrl");
  });

  it("lehnt zu lange Teamnamen ab (fremde Daten begrenzen)", () => {
    const result = tableRowSchema.safeParse({ ...validRow, teamName: "x".repeat(200) });
    expect(result.success).toBe(false);
  });

  it("lehnt falsche Typen ab", () => {
    const result = tableRowSchema.safeParse({ ...validRow, points: "20" });
    expect(result.success).toBe(false);
  });
});

describe("matchSchema", () => {
  it("macht aus matchResults = null ein leeres Array", () => {
    const parsed = matchSchema.parse({
      matchID: 1,
      matchDateTimeUTC: "2026-11-01T14:30:00Z",
      matchIsFinished: false,
      group: { groupName: "10. Spieltag", groupOrderID: 10 },
      team1: { teamName: "A" },
      team2: { teamName: "B" },
      matchResults: null,
    });
    expect(parsed.matchResults).toEqual([]);
  });
});

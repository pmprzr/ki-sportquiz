import { describe, expect, it } from "vitest";
import { getCurrentSeason } from "../lib/openligadb/leagues";

describe("getCurrentSeason", () => {
  it("nimmt ab Juli das laufende Jahr", () => {
    expect(getCurrentSeason(new Date(2026, 6, 1))).toBe(2026); // 1. Juli 2026
    expect(getCurrentSeason(new Date(2026, 10, 3))).toBe(2026); // 3. November 2026
  });

  it("nimmt bis Juni das Vorjahr", () => {
    expect(getCurrentSeason(new Date(2027, 0, 15))).toBe(2026); // Januar 2027
    expect(getCurrentSeason(new Date(2027, 5, 30))).toBe(2026); // 30. Juni 2027
  });
});

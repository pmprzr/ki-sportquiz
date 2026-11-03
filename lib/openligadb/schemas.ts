import { z } from "zod";

// Externe Strings begrenzen: Das sind fremde Daten, die später im Prompt landen.
const teamName = z.string().trim().min(1).max(80);

export const tableRowSchema = z.object({
  teamName,
  points: z.number().int(),
  matches: z.number().int(),
  won: z.number().int(),
  draw: z.number().int(),
  lost: z.number().int(),
  goals: z.number().int(),
  opponentGoals: z.number().int(),
  goalDiff: z.number().int(),
});
export const tableSchema = z.array(tableRowSchema);

const matchResultSchema = z.object({
  resultTypeID: z.number().int(), // 1 = Halbzeit, 2 = Endergebnis
  pointsTeam1: z.number().int(),
  pointsTeam2: z.number().int(),
});

export const matchSchema = z.object({
  matchID: z.number().int(),
  matchDateTimeUTC: z.string(),
  matchIsFinished: z.boolean(),
  group: z.object({
    groupName: z.string(),
    groupOrderID: z.number().int(),
  }),
  team1: z.object({ teamName }),
  team2: z.object({ teamName }),
  // Bei noch nicht gespielten Partien kann das Feld fehlen oder null sein → leeres Array
  matchResults: z
    .array(matchResultSchema)
    .nullish()
    .transform((r) => r ?? []),
});
export const matchListSchema = z.array(matchSchema);

export const currentGroupSchema = z.object({
  groupName: z.string(),
  groupOrderID: z.number().int(),
});

export type RawTableRow = z.infer<typeof tableRowSchema>;
export type RawMatch = z.infer<typeof matchSchema>;

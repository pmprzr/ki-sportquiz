import Link from "next/link";
import { z } from "zod";
import SiteHeader from "@/components/SiteHeader";
import { getLeagueSnapshot } from "@/lib/openligadb/client";
import { LEAGUE_LABELS, LEAGUE_SHORTCUTS } from "@/lib/openligadb/leagues";
import type { LeagueSnapshot, MatchResult } from "@/lib/openligadb/types";
import { formatSeason } from "@/lib/quiz/prompt";

// Ungültige oder fehlende Liga → Standard bl1
const leagueParam = z.enum(LEAGUE_SHORTCUTS).catch("bl1");

/** Ergebnisse nach Spieltag gruppieren, neuester Spieltag zuerst. */
function groupByMatchday(results: MatchResult[]): [number, MatchResult[]][] {
  const groups = new Map<number, MatchResult[]>();
  for (const m of results) {
    groups.set(m.matchday, [...(groups.get(m.matchday) ?? []), m]);
  }
  return [...groups.entries()].sort(([a], [b]) => b - a);
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

// Server Component: läuft nur auf dem Server, darf daher getLeagueSnapshot direkt aufrufen.
export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const league = leagueParam.parse((await searchParams).league);

  let snapshot: LeagueSnapshot | null = null;
  try {
    snapshot = await getLeagueSnapshot(league);
  } catch (err) {
    console.error(err);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
      <SiteHeader current="data" />
      <p className="mt-5 max-w-prose text-lg text-chalk-dim">
        Aus diesen Daten erstellt die KI die Quizfragen. Quelle ist OpenLigaDB, die Daten werden alle
        fünf Minuten aktualisiert.
      </p>

      <nav aria-label="Liga" className="mt-6 flex flex-wrap gap-2">
        {LEAGUE_SHORTCUTS.map((l) => (
          <Link
            key={l}
            href={`/data?league=${l}`}
            aria-current={l === league ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 font-display text-lg font-semibold ${
              l === league ? "bg-chalk text-ink" : "text-chalk-dim ring-1 ring-chalk/30 hover:text-chalk"
            }`}
          >
            {LEAGUE_LABELS[l]}
          </Link>
        ))}
      </nav>

      {!snapshot ? (
        <p role="alert" className="mt-6 rounded-lg border-l-4 border-goal bg-goal/10 p-4 text-chalk">
          Die Ligadaten konnten nicht geladen werden. Die genaue Ursache steht im Terminal.
        </p>
      ) : (
        <div className="mt-6 grid gap-6">
          <section className="rounded-2xl bg-chalk p-5 text-ink shadow-2xl shadow-black/30 sm:p-6">
            <h2 className="font-display text-3xl font-semibold">
              Tabelle {snapshot.leagueName} {formatSeason(snapshot.season)}
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead className="text-left text-ink/60">
                  <tr className="border-b-2 border-ink/15">
                    <th className="py-2 pr-2 font-medium">Pl.</th>
                    <th className="font-medium">Team</th>
                    <th className="px-2 text-right font-medium">Sp.</th>
                    <th className="hidden px-2 text-right font-medium sm:table-cell">S</th>
                    <th className="hidden px-2 text-right font-medium sm:table-cell">U</th>
                    <th className="hidden px-2 text-right font-medium sm:table-cell">N</th>
                    <th className="px-2 text-right font-medium">Tore</th>
                    <th className="px-2 text-right font-medium">Diff.</th>
                    <th className="pl-2 text-right font-medium">Pkt.</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.standings.map((s) => (
                    <tr key={s.team} className="border-b border-ink/10 last:border-0">
                      <td className="py-2 pr-2 text-ink/60">{s.position}</td>
                      <td className="font-medium">{s.team}</td>
                      <td className="px-2 text-right">{s.played}</td>
                      <td className="hidden px-2 text-right sm:table-cell">{s.won}</td>
                      <td className="hidden px-2 text-right sm:table-cell">{s.draw}</td>
                      <td className="hidden px-2 text-right sm:table-cell">{s.lost}</td>
                      <td className="px-2 text-right">
                        {s.goalsFor}:{s.goalsAgainst}
                      </td>
                      <td className="px-2 text-right">{signed(s.goalDiff)}</td>
                      <td className="pl-2 text-right font-semibold">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl bg-chalk p-5 text-ink shadow-2xl shadow-black/30 sm:p-6">
            <h2 className="font-display text-3xl font-semibold">Letzte Ergebnisse</h2>
            {groupByMatchday(snapshot.recentResults).map(([matchday, matches]) => (
              <div key={matchday} className="mt-5">
                <h3 className="font-display text-xl font-semibold text-ink/70">{matchday}. Spieltag</h3>
                <ul className="mt-2 divide-y divide-ink/10">
                  {matches.map((m) => (
                    <li
                      key={`${m.kickoffUtc}-${m.home}`}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 text-sm"
                    >
                      <span className="text-right font-medium">{m.home}</span>
                      <span className="rounded-md bg-pitch-900 px-2.5 py-0.5 font-display text-lg font-semibold tabular-nums text-flood">
                        {m.homeGoals}:{m.awayGoals}
                      </span>
                      <span className="font-medium">{m.away}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}

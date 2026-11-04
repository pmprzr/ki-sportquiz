import Link from "next/link";
import { z } from "zod";
import { getLeagueSnapshot } from "@/lib/openligadb/client";
import { LEAGUE_LABELS, LEAGUE_SHORTCUTS } from "@/lib/openligadb/leagues";
import type { LeagueSnapshot } from "@/lib/openligadb/types";

// Ungültige oder fehlende Liga → Standard bl1
const leagueParam = z.enum(LEAGUE_SHORTCUTS).catch("bl1");

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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:underline">← Zum Quiz</Link>
      <h1 className="mt-2 text-3xl font-bold">Datenbasis</h1>
      <p className="mt-2 text-slate-600">
        Aus diesen Daten erzeugt die KI die Quizfragen.
      </p>

      <nav className="mt-6 flex gap-2">
        {LEAGUE_SHORTCUTS.map((l) => (
          <Link
            key={l}
            href={`/data?league=${l}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              l === league ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-300"
            }`}
          >
            {LEAGUE_LABELS[l]}
          </Link>
        ))}
      </nav>

      {!snapshot ? (
        <p className="mt-8 rounded-lg bg-red-50 p-4 text-red-700">
          Ligadaten konnten nicht geladen werden. Details stehen im Terminal.
        </p>
      ) : (
        <div className="mt-8 grid gap-8">
          <section>
            <h2 className="text-xl font-semibold">
              Tabelle {snapshot.leagueName} {snapshot.season}/{(snapshot.season + 1) % 100}
            </h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-1">#</th>
                  <th>Team</th>
                  <th className="text-right">Sp.</th>
                  <th className="text-right">Diff.</th>
                  <th className="text-right">Pkt.</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.standings.map((s) => (
                  <tr key={s.team} className="border-t border-slate-200">
                    <td className="py-1">{s.position}</td>
                    <td>{s.team}</td>
                    <td className="text-right">{s.played}</td>
                    <td className="text-right">{s.goalDiff}</td>
                    <td className="text-right font-semibold">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Letzte Ergebnisse</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {snapshot.recentResults.map((m) => (
                <li key={`${m.kickoffUtc}-${m.home}`}>
                  <span className="text-slate-500">{m.matchday}. Spieltag:</span> {m.home}{" "}
                  <strong>
                    {m.homeGoals}:{m.awayGoals}
                  </strong>{" "}
                  {m.away}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}

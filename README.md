# KI-Sportquiz

Ein Quiz-Generator, der aus aktuellen Fußballdaten (Tabelle und Ergebnisse der 1. Bundesliga, 2. Bundesliga
und 3. Liga) mit der OpenAI-API Quizfragen erzeugt. Das Modell darf nur aus den übergebenen Daten fragen.

**Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS v4, zod, Vitest, OpenAI-API
**Datenquelle:** [OpenLigaDB](https://www.openligadb.de)

## Status

- [x] Server-Modul für OpenLigaDB mit Laufzeitvalidierung (zod), Caching und Timeout
- [x] Route Handler `GET /api/liga/[league]` und Startseite mit Tabelle und Ergebnissen
- [x] Tests für Saisonlogik, Schemas und Mapping
- [ ] Quizfragen mit OpenAI (strukturierte JSON-Ausgabe, per zod geprüft)
- [ ] Quiz-Oberfläche
- [ ] Optional: Supabase für gespeicherte Quizze, Highscores und Login

## Lokal starten

```bash
npm install
cp .env.example .env.local   # OPENAI_API_KEY eintragen
npm test
npm run dev                  # http://localhost:3000
```

## Grundsätze

- API-Key und Netzwerkcode nur auf dem Server (`server-only`)
- Externe Daten werden validiert, begrenzt und in eigene Typen gemappt, bevor sie weiterverwendet werden
- Eingaben (z. B. Liga-Kürzel) werden per Whitelist geprüft

# Anleitung: KI-Sportquiz (Stand: Schritt 2)

Dieser Ordner ist ein vollständiges Next.js-Projekt. Enthalten sind:

- Grundgerüst: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- Schritt 2: Server-Modul für OpenLigaDB (Tabelle + letzte Ergebnisse), validiert mit zod
- Ein Test-Endpunkt (`/api/liga/bl1`) und eine Startseite, die die Daten anzeigt
- Tests mit Vitest für die reine Logik (Saison, Schemas, Mapping)

Noch **nicht** enthalten: OpenAI-Anbindung (Schritt 3), Quiz-Oberfläche, Supabase.

---

## Teil A: Einrichten

### A1. Voraussetzungen prüfen

In Git Bash:

```bash
node -v   # sollte v20 oder neuer sein (empfohlen: v22 LTS)
npm -v
git --version
```

Falls Node fehlt oder älter als v20 ist: LTS-Version von https://nodejs.org installieren und Git Bash neu öffnen.

### A2. Ordner an die richtige Stelle legen

1. ZIP entpacken.
2. Den Ordner `ki-sportquiz` nach `C:\Sources\` verschieben, sodass es `C:\Sources\ki-sportquiz\package.json` gibt.

**Falls es `C:\Sources\ki-sportquiz` schon gibt** (z. B. von `create-next-app`):
benenne den alten Ordner um in `ki-sportquiz-alt`, lege den neuen hin und kopiere nur
die Datei `.env.local` aus dem alten Ordner herüber (falls vorhanden). Den alten Ordner kannst du
löschen, sobald alles läuft.

### A3. Abhängigkeiten installieren

```bash
cd /c/Sources/ki-sportquiz
npm install
```

Das legt `node_modules/` und `package-lock.json` an. Dauert ein bis zwei Minuten.

### A4. API-Key eintragen

```bash
cp .env.example .env.local
```

Dann `.env.local` im Editor öffnen und den echten OpenAI-Key eintragen:

```
OPENAI_API_KEY=sk-proj-...
```

`.env.local` steht in `.gitignore` und wird nie committet. In Schritt 2 wird der Key noch nicht benutzt,
er ist schon für Schritt 3 vorbereitet.

### A5. Prüfen, ob alles funktioniert

```bash
npm test            # Vitest: alle Tests sollten grün sein
npm run typecheck   # TypeScript: keine Fehler
npm run dev         # Entwicklungsserver starten
```

Dann im Browser:

| URL | Erwartung |
|---|---|
| http://localhost:3000 | Startseite mit Tabelle und letzten Ergebnissen der 1. Bundesliga, Umschalter für 2. und 3. Liga |
| http://localhost:3000/api/liga/bl1 | JSON mit `standings` (18 Teams) und `recentResults` |
| http://localhost:3000/api/liga/bl3 | JSON für die 3. Liga (20 Teams) |
| http://localhost:3000/api/liga/xyz | Status 400 mit Fehlermeldung |

Server stoppen: `Strg + C` im Terminal.

**Wenn ein Fehler „Unerwartetes Datenformat“ im Terminal erscheint:** OpenLigaDB hat ein Feld anders
benannt als erwartet. Darunter steht der zod-Fehler mit dem genauen Feldpfad. Öffne z. B.
https://api.openligadb.de/getbltable/bl1/2026 im Browser, vergleiche die Feldnamen und passe
`lib/openligadb/schemas.ts` an.

### A6. Git und GitHub

```bash
git init
git add .
git status          # Kontrolle: .env.local und node_modules dürfen NICHT auftauchen
git commit -m "Next.js-Grundgerüst und OpenLigaDB-Servermodul mit zod-Validierung"
```

Auf GitHub ein neues, leeres Repository `ki-sportquiz` anlegen (ohne README, ohne .gitignore), dann:

```bash
git branch -M main
git remote add origin https://github.com/pmprzr/ki-sportquiz.git
git push -u origin main
```

---

## Teil B: Was im Projekt steckt

```
ki-sportquiz/
├─ app/
│  ├─ layout.tsx                 Grundlayout (HTML-Rahmen, Tailwind einbinden)
│  ├─ page.tsx                   Startseite (Server Component)
│  ├─ globals.css                Tailwind v4: nur "@import 'tailwindcss'"
│  └─ api/liga/[league]/route.ts Route Handler: GET /api/liga/bl1
├─ lib/openligadb/
│  ├─ leagues.ts                 erlaubte Ligen + Saisonberechnung   (rein, testbar)
│  ├─ schemas.ts                 zod-Schemas für die Rohdaten        (rein, testbar)
│  ├─ mappers.ts                 Rohdaten → eigene Typen              (rein, testbar)
│  ├─ types.ts                   eigene Domänentypen
│  └─ client.ts                  fetch, Caching, Fehler               (nur Server)
├─ tests/                        Vitest-Tests für leagues, schemas, mappers
├─ .env.example                  Vorlage für .env.local
├─ package.json                  Abhängigkeiten und Skripte
├─ tsconfig.json                 TypeScript-Einstellungen, Alias "@/*"
├─ postcss.config.mjs            bindet Tailwind v4 ein
└─ vitest.config.mts             Test-Konfiguration
```

### Die Grundidee der Aufteilung

Reine Logik (Saison, Validierung, Mapping) ist getrennt vom Netzwerkcode. Dadurch lässt sie sich mit
Vitest testen, ohne Next.js und ohne Internetverbindung. `client.ts` wird bewusst **nicht** getestet,
weil es `server-only` importiert und echte Netzwerkaufrufe macht.

### Datei für Datei

**`leagues.ts`**
- `as const` macht das Array zum Tupel mit festen Werten. `LeagueShortcut` ist damit genau
  `"bl1" | "bl2" | "bl3"`. Eine einzige Liste dient als Typ **und** als Laufzeit-Whitelist.
- `getCurrentSeason(now)` bekommt das Datum als Parameter, damit der Test ein festes Datum übergeben kann.
  OpenLigaDB benennt die Saison nach dem Startjahr (2026/27 → 2026).

**`schemas.ts`**
- zod prüft zur **Laufzeit**, ob Daten die erwartete Form haben. TypeScript-Typen existieren nach dem
  Kompilieren nicht mehr und schützen daher nicht vor falschen API-Antworten.
- `z.object` entfernt unbekannte Felder (Logos, Stadien …). Wir behalten nur, was wir brauchen.
- Teamnamen sind auf 80 Zeichen begrenzt: Diese fremden Daten landen später im Prompt.
- `z.infer` leitet den TypeScript-Typ aus dem Schema ab, die Struktur steht nur an einer Stelle.

**`types.ts`**
- Eigene Typen, unabhängig von der API-Struktur. Ändert sich OpenLigaDB, passt man nur Schema und Mapper
  an. Klare Namen (`home`/`away` statt `team1`/`team2`) helfen auch später dem Sprachmodell.

**`mappers.ts`**
- Nimmt gezielt den Endstand (`resultTypeID === 2`), nicht den Halbzeitstand.
- Unfertige Spiele werden verworfen: Das Modell soll nie aus offenen Spielen fragen.
- `(m): m is MatchResult => …` ist ein **Type Guard**: Danach weiß TypeScript, dass kein `null` mehr drin ist.

**`client.ts`**
- `import "server-only"`: Importiert eine Client-Komponente dieses Modul, bricht der Build ab.
  So landen Servercode und später der API-Key nie im Browser.
- `fetchJson<T>(path, schema)`: eine zentrale Stelle für Netzwerk, Statuscode und Validierung;
  der Rückgabetyp ergibt sich aus dem Schema. Ähnlich wie `HttpClient` in Angular, nur mit Laufzeitprüfung.
- `next: { revalidate: 300 }`: Next.js cacht die Antwort 5 Minuten. Schont OpenLigaDB und spart später Kosten.
- `AbortSignal.timeout(8000)`: Bricht hängende Anfragen nach 8 Sekunden ab.
- `json: unknown`: Das JSON gilt als unbekannt, bis zod es geprüft hat.
- `OpenLigaDbError`: eigene Fehlerklasse, damit der Aufrufer „externe API kaputt“ (502) von
  „eigener Bug“ (500) unterscheiden kann. `cause` behält den Originalfehler fürs Log.
- `Promise.all`: Tabelle und Spieltage werden parallel geladen.

**`app/api/liga/[league]/route.ts`** (Route Handler)
- Eine `route.ts` exportiert Funktionen mit HTTP-Methodennamen (`GET`, `POST` …).
  Der Ordnerpfad ist die URL; `[league]` ist ein dynamisches Segment (wie `:league` im Angular-Router).
- Seit Next.js 15 ist `params` ein Promise und wird mit `await` gelesen.
- `z.enum(LEAGUE_SHORTCUTS)` validiert die Eingabe, bevor sie in eine URL geht.
- Nach außen nur eine schlichte Fehlermeldung, Details nur ins Server-Log.

**`app/page.tsx`** (Server Component)
- Komponenten im App Router sind standardmäßig **Server Components**: Sie laufen nur auf dem Server und
  dürfen `async` sein. Deshalb kann die Seite `getLeagueSnapshot` direkt aufrufen, ohne Umweg über HTTP.
- `searchParams` (z. B. `?liga=bl2`) ist ebenfalls ein Promise. `z.enum(...).catch("bl1")` macht aus
  ungültigen Werten den Standard `bl1`.
- In React gibt man Listen mit `.map()` aus und braucht für jedes Element einen eindeutigen `key`
  (entspricht grob `*ngFor` mit `trackBy` in Angular).

### Kurzfassung fürs Vorstellungsgespräch

> „Externe Daten behandle ich als nicht vertrauenswürdig. Sie werden zur Laufzeit mit zod validiert,
> auf die benötigten Felder reduziert und in eigene Domänentypen gemappt. Der Netzwerkcode ist mit
> `server-only` vom Client getrennt, hat Timeout und Caching und eine eigene Fehlerklasse. Die reine Logik
> liegt in eigenen Modulen und ist mit Vitest ohne Netzwerk getestet.“

---

## Teil C: Wie es weitergeht

- **Schritt 3:** zod-Schema für Quizfragen, Prompt, der nur Daten aus `LeagueSnapshot` verwenden darf,
  Aufruf der OpenAI-API mit strukturierter Ausgabe (Paket `openai`).
- **Schritt 4:** Server Action zum Erzeugen eines Quiz und eine Quiz-Oberfläche (Client Component).
- **Später:** Supabase für gespeicherte Quizze, Highscores und Login.

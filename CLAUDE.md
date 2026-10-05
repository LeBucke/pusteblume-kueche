# Pusteblume Küche

Web App (PWA) der Kita Pusteblume e.V. Kempen für Rezepte, Speiseplan, Einkauf und eine Elternansicht.

**SPEC.md ist die verbindliche Spezifikation.** Bei Widersprüchen gilt SPEC.md vor allem anderen, außer Paul entscheidet im Chat anders.

## Arbeitsweise

Die Umsetzung ist in Arbeitspakete geteilt: `docs/tasks/NN-name.md`, Stand in `docs/PROGRESS.md`.

- Genau EIN Paket pro Sitzung. Nach Abschluss stoppen, nicht mit dem nächsten Paket anfangen.
- Vor dem Coden: Paketdatei und die dort genannten SPEC Abschnitte lesen, prüfen ob die Vorgängerpakete in PROGRESS.md abgehakt sind, einen kurzen Plan zeigen und auf Pauls OK warten.
- Nur umsetzen, was im Paket steht. Ideen für später als Notiz in `docs/DECISIONS.md` unter „Offen“ sammeln, nicht einbauen.
- Unklarheit oder Widerspruch zur SPEC: nachfragen statt raten. Getroffene Entscheidungen mit Datum in `docs/DECISIONS.md` festhalten.
- Am Ende: alle Prüfbefehle laufen lassen und Fehler beheben, PROGRESS.md aktualisieren (Haken, Datum, ein Satz zum Stand), committen mit `Paket NN: Titel`, Paul kurz sagen, was er von Hand testen soll.
- Für ein Paket gibt es die Abkürzung `/paket` (nächstes offenes Paket) oder `/paket 05`.

## Befehle

```
npm run dev          # Entwicklungsserver
npm run lint
npm run typecheck    # tsc --noEmit
npm test             # Vitest
npm run build
npx supabase db push                     # Migrationen auf das verknüpfte Projekt
npx supabase gen types typescript --linked > lib/database.types.ts
```

Vor jedem Commit müssen lint, typecheck, test und build grün sein.

## Technik und Konventionen

- Next.js App Router, TypeScript strict, Tailwind CSS, Server Actions mit zod Validierung.
- Supabase über `@supabase/ssr`. Clients in `lib/supabase/` (`server.ts`, `client.ts`, `admin.ts`). Der Service Role Key wird nur in `admin.ts` gelesen, nur serverseitig, nie in Client Komponenten importieren.
- Datenbank nur über Migrationen in `supabase/migrations/`. Bestehende Migrationen nie ändern, immer eine neue anlegen. Nach jeder Schemaänderung Typen neu erzeugen.
- Jede neue Tabelle bekommt RLS mit Policies nach SPEC Abschnitt 5. Ohne RLS kein Merge.
- Fachlogik (Mengen, Allergene, Rotation, Einkaufssumme) liegt als reine Funktionen in `lib/` mit Vitest Tests. Komponenten rechnen nicht selbst.
- Datumswerte als `YYYY-MM-DD` in lokaler Zeit (Europe/Berlin). Kein `toISOString()` für Tagesdaten.
- Zahlen in der Oberfläche im deutschen Format (Komma).
- Keine neuen Abhängigkeiten ohne Grund. Wenn nötig, im Plan nennen.

## Oberfläche

- Sprache Deutsch, Ansprache mit „du“, Satzanfänge groß, sonst normale Schreibung.
- Farben, Schriften, Rundungen ausschließlich über die Tokens aus SPEC 7a (Tailwind Theme). Keine Hexwerte direkt in Komponenten.
- Designvorlagen in `docs/design/` (siehe README dort). Aufbau und Abstände von dort übernehmen.
- Echte `<button>`, `<a>`, `<label>` verwenden. Bedienelemente mindestens 44 px hoch, Fokus sichtbar.
- Jede Ansicht muss auf Handybreite (390 px) funktionieren.
- Kein Tracking, keine Cookies außer der Supabase Sitzung, localStorage nur für die Haushaltsgröße in der Elternansicht.

## Ordner

```
app/            Routen (App Router)
components/     UI Bausteine
lib/            Fachlogik, Supabase Clients, Typen
supabase/       migrations/, seed.sql
docs/           tasks/, design/, PROGRESS.md, DECISIONS.md, SETUP.md
```

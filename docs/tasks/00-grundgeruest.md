# Paket 00: Grundgerüst

**Ziel:** Ein lauffähiges, leeres Next.js Projekt mit Design Tokens, Schriften, App Rahmen und allen Prüfbefehlen.
**Voraussetzung:** docs/SETUP.md „Vor Paket 00“.
**Lies:** SPEC 7, 7a; CLAUDE.md; docs/design/README.md und `kueche-heute.dc.html` (Kopfbereich, Navigation).

## Umfang
- Next.js (aktuelle stabile Version) mit App Router, TypeScript strict, Tailwind, ESLint anlegen. `create-next-app` bricht in einem Ordner mit vorhandenen Dateien ab: deshalb in einen temporären Unterordner erzeugen, Inhalte in den Projektordner verschieben, Unterordner löschen. Bestehende Dateien (SPEC.md, CLAUDE.md, docs/, .claude/, .env.example) nicht überschreiben.
- Git initialisieren, falls noch nicht geschehen.
- npm Skripte: `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (Vitest, `vitest run`).
- Vitest einrichten mit einem trivialen Beispieltest in `lib/`.
- Tailwind Theme mit allen Farb Tokens aus SPEC 7a (Namen wie in der Tabelle), Radius Tokens, Schriftfamilien `display` (Dosis) und `body` (Nunito) über `next/font/google`.
- `.gitignore` inkl. `.env.local`; `.env.example` bleibt.
- App Rahmen für Teamansichten: Kopfzeile mit Logo (`public/logo.png`, Kopie aus docs/design/pusteblume-logo.png) und Navigation als Pillen wie in der Designvorlage; auf Handybreite Navigation als untere Leiste.
- Leere Seiten mit Überschrift für `/heute`, `/plan`, `/rezepte`, `/zutaten`, `/vorlagen`, `/einkauf`, `/admin`. Startseite `/` leitet vorerst auf `/heute`.
- Gemeinsame UI Bausteine in `components/ui/`: Button (primär, sekundär, Größen), Chip, Card, Pill Tabs. Nur so viel, wie der Rahmen braucht.
- `lang="de"`, Seitentitel „Pusteblume Küche“.

## Nicht in diesem Paket
Supabase, Login, echte Daten, PWA Manifest.

## Fertig, wenn
- [ ] `npm run lint`, `typecheck`, `test`, `build` sind grün.
- [ ] Alle Routen zeigen den Rahmen mit Logo und Navigation, aktive Seite ist markiert.
- [ ] Auf 390 px Breite ist die Navigation unten und nichts läuft seitlich über.
- [ ] Keine Hexwerte in Komponenten, nur Tokens.
- [ ] Erster Commit `Paket 00: Grundgerüst`.

## Von Hand testen
1. `npm run dev`, http://localhost:3000 öffnen, durch alle Menüpunkte klicken.
2. Im Browser auf Handygröße stellen (Entwicklertools) und Navigation prüfen.

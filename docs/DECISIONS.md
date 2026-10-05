# Entscheidungen

Format: Datum, Paket, Entscheidung, Grund.

## Getroffen

- 2026-10-05, Paket 00: `@types/node` auf Version 24 angehoben, weil Vitest 5 mindestens 22 verlangt und lokal Node 24 läuft. Grund: kein `--force` bei der Installation nötig.
- 2026-10-05, Paket 00: Rand in Buttons und Pillen nutzt den Token `line` (#E2DCCD) statt `#D9D2C1` aus der Designvorlage, der aktive Pillenring ist ein echter Rahmen statt `box-shadow`. Grund: SPEC 7a kennt `#D9D2C1` nicht und verbietet Schatten.
- 2026-10-05, Paket 00: Zusätzliche Tokens `line-soft` (#ECE6D8), `course-main-line` (#E2C55E) und `course-*-ink/-surface` direkt aus SPEC 7a übernommen, dazu die Abstände `touch` (44 px) und `touch-kitchen` (52 px) für die Mindesthöhen.
- 2026-10-05, Paket 00: Navigation zeigt vorläufig alle sechs Punkte (Heute, Speiseplan, Rezepte, Vorlagen, Einkauf, Admin). `/zutaten` hat eine Seite, aber keinen Navigationspunkt, Zugang folgt über Rezepte und Admin. Rollenfilter kommt mit Paket 03.
- 2026-10-05, Paket 00: Das Logo `public/logo.png` ist weiter der Platzhalter aus docs/design, bis die Originaldatei der Kita vorliegt.
- 2026-10-05, Paket 00: `AGENTS.md` von `create-next-app` bleibt im Projekt (Hinweis, bei Next 16 die Docs in `node_modules/next/dist/docs/` zu lesen). `next dev` legt die Datei sonst wieder an.

## Offen (Ideen für später, nicht umsetzen)

- `npm audit` meldet 5 Schwachstellen (hoch) in `braces` über `eslint-config-next`. Betrifft nur das Linten in der Entwicklung, nicht die ausgelieferte App. Beobachten, ob `eslint-config-next` das behebt.
- Standard-Favicon von Next noch vorhanden, wird mit Paket 15 (PWA-Icons) ersetzt.

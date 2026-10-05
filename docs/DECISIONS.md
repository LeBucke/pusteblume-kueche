# Entscheidungen

Format: Datum, Paket, Entscheidung, Grund.

## Getroffen

- 2026-10-05, Paket 00: `@types/node` auf Version 24 angehoben, weil Vitest 5 mindestens 22 verlangt und lokal Node 24 läuft. Grund: kein `--force` bei der Installation nötig.
- 2026-10-05, Paket 00: Rand in Buttons und Pillen nutzt den Token `line` (#E2DCCD) statt `#D9D2C1` aus der Designvorlage, der aktive Pillenring ist ein echter Rahmen statt `box-shadow`. Grund: SPEC 7a kennt `#D9D2C1` nicht und verbietet Schatten.
- 2026-10-05, Paket 00: Zusätzliche Tokens `line-soft` (#ECE6D8), `course-main-line` (#E2C55E) und `course-*-ink/-surface` direkt aus SPEC 7a übernommen, dazu die Abstände `touch` (44 px) und `touch-kitchen` (52 px) für die Mindesthöhen.
- 2026-10-05, Paket 00: Navigation zeigt vorläufig alle sechs Punkte (Heute, Speiseplan, Rezepte, Vorlagen, Einkauf, Admin). `/zutaten` hat eine Seite, aber keinen Navigationspunkt, Zugang folgt über Rezepte und Admin. Rollenfilter kommt mit Paket 03.
- 2026-10-05, Paket 00: Das Logo `public/logo.png` ist weiter der Platzhalter aus docs/design, bis die Originaldatei der Kita vorliegt.
- 2026-10-05, Paket 00: `AGENTS.md` von `create-next-app` bleibt im Projekt (Hinweis, bei Next 16 die Docs in `node_modules/next/dist/docs/` zu lesen). `next dev` legt die Datei sonst wieder an.
- 2026-10-05, Paket 01: Das Beispiel in der Paketdatei („Faktor 1,5“) meint den Erwachsenenfaktor. Der Skalierungsfaktor für 20/5 → 18/5 ist 25,5 / 27,5 = 0,927. 6000 g Kartoffeln ergeben 5,6 kg, für 2/2 ergeben sie 1,1 kg. Beides ist als Test hinterlegt.
- 2026-10-05, Paket 01: Stückeinheiten sind St., Pckg., Dose, Glas, Bund. EL, TL, Prise zeigen eine Nachkommastelle ohne Endnull („2 EL“, „1,5 EL“), kg und l immer mit einer („2,0 kg“). Gerundet wird zuerst, danach umgerechnet (995 g → „1,0 kg“).
- 2026-10-05, Paket 01: Positive Mengen werden nie als 0 angezeigt. Das gilt für g und ml (mindestens 1), Stückeinheiten (mindestens 0,5, auch im Rezept, nicht nur in der Elternansicht) und EL, TL, Prise (mindestens 0,1). Das erweitert SPEC 6.
- 2026-10-05, Paket 01: Mengen ohne bekannte Einheit (leer oder unbekannt) bleiben unverändert und zeigen höchstens zwei Nachkommastellen. Sie bilden im Einkauf eine eigene Zeile (Schlüssel `<id>:`).
- 2026-10-05, Paket 01: Einkauf: Geschlossene Tage zählen nicht. Positionen mit Summe 0 (z. B. 0 Personen) entfallen. Lieferant = Lieferant der Zutat, sonst Standardlieferant der Warengruppe, sonst „Ohne Lieferant“. Fehlt die Warengruppe, heißt sie „Ohne Warengruppe“. Beide sortieren ans Ende.
- 2026-10-05, Paket 01: „Vorrat prüfen“ enthält eine Zutat nur, wenn sie in keinem Rezept des Zeitraums eine Menge hat. `aggregateShopping` bekommt Lieferanten und Warengruppen über `settings`. `toShareText` filtert nach Lieferant-ID, lässt abgehakte Schlüssel weg und enthält „Vorrat prüfen“ nicht.
- 2026-10-05, Paket 01: Allergen-Schlüssel sind `gluten`, `krebstiere`, `eier`, `fisch`, `erdnuesse`, `soja`, `milch`, `schalenfruechte`, `sellerie`, `senf`, `sesam`, `sulfite`, `lupinen`, `weichtiere`. Kurzname für Schalenfrüchte ist „Nüsse“. Ein Rezept ohne Zutaten gilt als vollständig (`complete = true`), weil die SPEC nur ungeprüfte Zutaten nennt.
- 2026-10-05, Paket 01: `templateIndexForWeek` und `applyRotation` normalisieren Start und Woche auf den Montag. Ohne Vorlagen oder ohne Startmontag gibt es keine Position beziehungsweise keine Einträge.

## Offen (Ideen für später, nicht umsetzen)

- `npm audit` meldet 5 Schwachstellen (hoch) in `braces` über `eslint-config-next`. Betrifft nur das Linten in der Entwicklung, nicht die ausgelieferte App. Beobachten, ob `eslint-config-next` das behebt.
- Standard-Favicon von Next noch vorhanden, wird mit Paket 15 (PWA-Icons) ersetzt.

# Paket 01: Rechenlogik

**Ziel:** Alle Fachberechnungen als getestete, reine Funktionen, bevor es eine Datenbank gibt.
**Voraussetzung:** Paket 00.
**Lies:** SPEC 3, 4.3, 4.6, 4.8, 6.

## Umfang
- `lib/units.ts`: Einheitenliste aus SPEC 6, Umrechnung in Basiseinheiten (g, ml, Rest bleibt).
- `lib/quantities.ts`:
  - `portions(children, adults, adultFactor)`
  - `scaleFactor(recipeBase, target, adultFactor)`
  - `formatAmount(value, unit, context)` mit `context` = `recipe` | `shopping` | `parents` und den Rundungsregeln aus SPEC 6 (kg/l ab 1000, Stück im Einkauf aufrunden, in der Elternansicht nie 0). Ausgabe mit Komma.
- `lib/allergens.ts`: feste Liste der 14 Allergene (Schlüssel, Langname, Kurzname wie „Gluten“), `deriveAllergens(ingredients)` liefert `{ allergens, complete }`; `complete = false`, sobald eine Zutat ungeprüft ist.
- `lib/rotation.ts`: `templateIndexForWeek(monday, rotationStart, count)`; `applyRotation(range, rotation, existingPlan, closedDays)` liefert nur Einträge für leere Gänge an offenen Tagen.
- `lib/shopping.ts`: `aggregateShopping(planDays, recipes, ingredients, settings)` liefert Positionen mit Schlüssel `<ingredient_id>:<basiseinheit>`, Summe, Rezeptnamen, Lieferant, Warengruppe, plus Liste „Vorrat prüfen“ (Zutaten ohne Menge). Getrennte Zeilen bei verschiedenen Einheitenfamilien. `toShareText(supplier, items, range, checked)` im Format aus SPEC 4.8.
- `lib/dates.ts`: lokale Datumshilfen (Montag einer Woche, Tage addieren, Wochenenden, deutsches Format), ohne Zeitzonenfehler.
- Eigene, schlanke Typen in `lib/types.ts` (später an die DB Typen anpassbar).

## Nicht in diesem Paket
Datenbank, Oberfläche.

## Fertig, wenn
- [ ] Jede Funktion hat Tests, inklusive Randfälle: 0 Personen, fehlende Menge, kg plus g derselben Zutat, Zutat in g und in St., ungeprüfte Zutat, Rotation über Jahreswechsel, Zeitumstellung Ende Oktober.
- [ ] Beispiel aus SPEC: Kartoffelgratin Grundrezept 20/5, Ziel 18/5, Faktor 1,5 ergibt 5,6 kg Kartoffeln; für 2/2 in der Elternansicht 1,1 kg.
- [ ] Alle Prüfbefehle grün.

## Von Hand testen
Nichts in der Oberfläche. `npm test` zeigt die Tests.

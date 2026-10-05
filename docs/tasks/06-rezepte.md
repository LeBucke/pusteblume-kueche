# Paket 06: Rezepte

**Ziel:** Rezeptsammlung mit Erfassung, Umrechnung und abgeleiteten Allergenen.
**Voraussetzung:** Paket 05.
**Lies:** SPEC 4.3, 4.4, 6; docs/design/kueche-heute.dc.html (Zutatentabelle, Chips); docs/design/prototyp-funktionen.html (Rezeptliste und Editor als Ablaufvorlage).

## Umfang
- `/rezepte`: Liste nach Gang gruppiert, Suche (Name, Kategorie, Zutat), Filter Gang, Kategorie, „ohne Allergen X“. Archivierte ausgeblendet, per Schalter sichtbar.
- Detail `/rezepte/[id]`: Gang, Kategorie, Autor, Beschreibung, abgeleitete Allergene (mit deutlichem Hinweis bei unvollständig), Eingabe Kinder und Erwachsene (Standard aus Einstellungen), Zutaten umgerechnet über `lib/quantities.ts`, Schritte nummeriert, Hinweise, „zuletzt gekocht“ und „nächster Termin“ (sobald Plandaten existieren, sonst ausblenden), Küchenrückmeldungen der letzten Male (sobald vorhanden).
- Editor (neu und bearbeiten): Felder aus SPEC 4.4, Zutatenzeilen mit `IngredientPicker`, Menge (Komma erlaubt), Einheit, Notiz, Reihenfolge per Hoch und Runter Buttons. Zubereitung als Textfeld, jede Zeile ein Schritt.
- Kopie anlegen, archivieren und wiederherstellen. Kein hartes Löschen in der Oberfläche.
- Druckansicht eines Rezepts (CSS print).

## Nicht in diesem Paket
Speiseplan, Import.

## Fertig, wenn
- [ ] Ein Rezept mit 8 Zutaten lässt sich in unter 3 Minuten erfassen, ohne die Maus zu brauchen (Tab Reihenfolge stimmt).
- [ ] Allergene ändern sich sofort, wenn an einer Zutat ein Allergen ergänzt wird.
- [ ] Rezept mit ungeprüfter Zutat zeigt den Hinweis „Allergenangaben unvollständig“.
- [ ] Prüfbefehle grün.

## Von Hand testen
1. Kartoffelgratin aus dem Prototyp abtippen, auf 18/5 umrechnen, mit SPEC Beispiel vergleichen.
2. Kopie anlegen, archivieren, Filter „ohne Milch“ ausprobieren.

# Paket 14: Import der alten Rezepte

**Ziel:** Rezepte aus dem Prototyp und von der alten Seite übernehmen.
**Voraussetzung:** Paket 06.
**Lies:** SPEC 8.

## Umfang
- Admin › Import: JSON Datei im Prototyp Format (SPEC 8) hochladen.
- Vorschau: neue Rezepte, zugeordnete und neue Zutaten, Plantage. Zuordnung über normalisierten Namen und Synonyme; neue Zutaten mit Warengruppe aus `gruppe`, `allergens_checked = false`.
- Alte Rezeptallergene nach `legacy_allergens`, Allergennamen auf die Schlüssel abbilden.
- Mehrfaches Importieren erzeugt keine Dubletten (gleicher Name und Gang = Update nach Rückfrage).
- Abgleichsseite: Rezepte, bei denen abgeleitete Allergene und `legacy_allergens` abweichen, mit Link zu den betroffenen Zutaten.

## Fertig, wenn
- [ ] `docs/import/prototyp-sicherung.json` (6 Rezepte) lässt sich importieren und erscheint korrekt.
- [ ] Zweiter Import erzeugt keine Dubletten.
- [ ] Prüfbefehle grün.

## Von Hand testen
`docs/import/prototyp-sicherung.json` importieren, Abgleichsseite durchgehen. Weitere Rezepte der alten Seite vorher in dasselbe Format bringen.

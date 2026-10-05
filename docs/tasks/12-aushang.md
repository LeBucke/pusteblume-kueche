# Paket 12: Aushang

**Ziel:** Wochenplan zum Aushängen als PDF über den Druckdialog.
**Voraussetzung:** Paket 07.
**Lies:** SPEC 4.10, 4.3.

## Umfang
- `/druck/woche/[start]`: A4 quer, Logo, „Speiseplan“ und Datumsbereich, fünf Spalten Mo bis Fr mit drei Gängen, Allergene je Gericht ausgeschrieben, Legende, Hinweis bei unvollständigen Angaben, Fußzeile mit Kontakt der Kita.
- `@page` und Print CSS so, dass genau eine Seite entsteht; Bildschirmansicht mit Knopf „Drucken“.
- Knopf „Aushang drucken“ im Speiseplan führt hierher.

## Fertig, wenn
- [ ] Druckvorschau in Chrome und Safari zeigt eine saubere Seite ohne Navigation.
- [ ] Prüfbefehle grün.

## Von Hand testen
Aushang als PDF speichern und ausdrucken.

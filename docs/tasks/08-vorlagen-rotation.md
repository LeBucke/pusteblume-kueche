# Paket 08: Vorlagen und Rotation

**Ziel:** Wiederkehrende Wochen schnell einplanen.
**Voraussetzung:** Paket 07.
**Lies:** SPEC 4.6, 5 (week_templates, rotation_entries); `lib/rotation.ts` aus Paket 01.

## Umfang
- `/vorlagen`: Liste, anlegen, umbenennen, archivieren. Editor als Raster Montag bis Freitag mal drei Gänge mit denselben Auswahlfeldern wie im Speiseplan. Markierung, wenn eine Vorlage archivierte Rezepte enthält.
- Im Speiseplan: „Woche als Vorlage speichern“ und „Vorlage auf diese Woche anwenden“ (nur leere Gänge füllen, Vorschau).
- Rotation in den Einstellungen (Admin oder Planung): Startmontag wählen, Vorlagen in Reihenfolge bringen (Hoch und Runter).
- Im Speiseplan: Kalenderwochen zeigen den Namen der Rotationsvorlage; Knopf „Rotation anwenden“ für einen Zeitraum mit Vorschau (welche Tage, welche Gerichte) und dann Übernahme. Geschlossene Tage und vorhandene Einträge bleiben unberührt.

## Fertig, wenn
- [ ] Mit 4 Vorlagen und Start am 5.10.2026 zeigt KW 45 die Vorlage an Position 1 (Test).
- [ ] „Rotation anwenden“ überschreibt nie etwas (Test und Vorschau).
- [ ] Prüfbefehle grün.

## Von Hand testen
1. Zwei Wochen planen, beide als Vorlage speichern, Rotation mit beiden anlegen.
2. Rotation auf die nächsten 6 Wochen anwenden und Ergebnis ansehen.

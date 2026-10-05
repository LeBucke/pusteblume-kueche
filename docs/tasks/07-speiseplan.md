# Paket 07: Speiseplan

**Ziel:** Monats und Wochenplanung mit drei Gängen pro Tag.
**Voraussetzung:** Paket 06.
**Lies:** SPEC 4.5; docs/design/speiseplan.dc.html.

## Umfang
- `/plan` Monatsansicht Montag bis Freitag wie in der Designvorlage: Kalenderwoche links, Tage mit farbigen Gangpunkten, Allergenchip, „heute“ Markierung, leere Tage mit „Tag planen“, geschlossene Tage farbig. Navigation Monat vor und zurück.
- Wochenansicht mit mehr Platz pro Tag.
- Tag bearbeiten (Dialog): drei Auswahlfelder nach SPEC 4.5 (eigener Gang zuerst, nach Kategorie, dahinter „zuletzt am …“), interne Notiz, Notiz für Eltern, geschlossen mit Grund, abweichende Anzahl. Speichern, Tag leeren.
- Woche kopieren auf eine Zielwoche mit Vorschau und Rückfrage, wenn dort schon etwas geplant ist.
- Bearbeiten nur für planung und admin, alle anderen sehen den Plan nur.

## Nicht in diesem Paket
Vorlagen, Rotation, Aushang.

## Fertig, wenn
- [ ] Ein Monat lässt sich vollständig planen; Änderungen sind nach Neuladen da.
- [ ] Archivierte Rezepte erscheinen nicht in der Auswahl, bleiben aber in alten Tagen sichtbar.
- [ ] Ansicht ist auf dem Handy horizontal scrollbar statt gequetscht.
- [ ] Prüfbefehle grün.

## Von Hand testen
1. Eine Woche planen, einen Tag schließen, einen Tag mit 15 Kindern eintragen.
2. Woche in die nächste Woche kopieren.

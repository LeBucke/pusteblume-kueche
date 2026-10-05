# Paket 09: Küche: Heute

**Ziel:** Die Tagesansicht für die Köchin auf dem Tablet.
**Voraussetzung:** Paket 07.
**Lies:** SPEC 4.7; docs/design/kueche-heute.dc.html (genau so aufbauen).

## Umfang
- `/heute` mit Datum als große Überschrift, Gruppengröße (mit Hinweis bei Abweichung), Navigation Vortag, Heute, Folgetag (Wochenenden überspringen), Wochenleiste Mo bis Fr.
- Hauptgang groß mit Zutaten (umgerechnet für den Tag) und Schritten, Vorspeise und Nachtisch kompakter daneben, Allergene je Gang, interne Notiz als Hinweis.
- Leerer Tag: Hinweis und für Planung ein Knopf „Tag planen“. Geschlossener Tag: groß „Geschlossen“ mit Grund.
- Rückmeldung je Gang: Menge (zu wenig, passt, zu viel), kam gut an (ja, geht so, nein), Freitext. Speichern sofort, änderbar bis zum Folgetag.
- Bildschirm bleibt an über die Screen Wake Lock API, wenn verfügbar, mit Schalter.
- Layout für Tablet quer optimiert, auf dem Handy untereinander.

## Fertig, wenn
- [ ] Mengen stimmen mit `lib/quantities.ts` und der Abweichung des Tages überein.
- [ ] Rückmeldung kann Rolle kueche schreiben, Rolle einkauf nicht.
- [ ] Ansicht ist auf einem Tablet in 2 m Abstand lesbar (Schriftgrößen wie Vorlage).
- [ ] Prüfbefehle grün.

## Von Hand testen
1. Auf einem Tablet öffnen, Tag vor und zurück blättern, Rückmeldung geben.
2. Prüfen, ob das Display an bleibt.

# Paket 10: Einkauf

**Ziel:** Summierte Einkaufsliste je Lieferant, live abhakbar.
**Voraussetzung:** Paket 07.
**Lies:** SPEC 4.8, 6; docs/design/einkauf.dc.html; `lib/shopping.ts` aus Paket 01.

## Umfang
- `/einkauf`: Zeitraum (Start, Tage, Schnellwahl Woche vor und zurück), Liste der geplanten Gerichte, Umschalter je Lieferant, Fortschritt „X von Y erledigt“.
- Positionen gruppiert nach Warengruppe in der eingestellten Reihenfolge, mit Menge, Rezepten, großer Checkbox (ganze Zeile klickbar).
- Einkaufsliste in `shopping_lists` anlegen, sobald jemand etwas abhakt oder ergänzt. Haken in `shopping_checks` mit `amount_at_check`.
- Realtime: Haken und Zusatzartikel erscheinen ohne Neuladen auf anderen Geräten (Supabase Realtime, sauber abmelden beim Verlassen).
- Geänderte Menge nach dem Abhaken: Position markieren („Menge geändert, vorher 4 kg“).
- Zusatzartikel: hinzufügen, abhaken, löschen.
- Bereich „Vorrat prüfen“.
- „Für WhatsApp kopieren“: Text nach SPEC 4.8 über `toShareText`, Zwischenablage mit Fallback (Textfeld zum Markieren).
- Druckansicht.

## Fertig, wenn
- [ ] Zwei Browserfenster nebeneinander: Haken erscheint im anderen Fenster in wenigen Sekunden.
- [ ] Summen stimmen mit den Tests aus Paket 01 überein.
- [ ] Rolle kueche kann nicht abhaken (nur lesen).
- [ ] Prüfbefehle grün.

## Von Hand testen
1. Liste auf dem Handy öffnen, abhaken, auf dem Laptop zusehen.
2. Text kopieren und in WhatsApp an dich selbst einfügen.

**Hinweis für Paul:** Realtime und Summierung sind der zweite knifflige Teil. Wenn etwas hakt, eine Sitzung nur zum Prüfen nutzen.

# Paket 05: Zutaten und Allergene

**Ziel:** Zutaten als Stammdaten mit Allergenen, Prüfstatus und Dublettenschutz.
**Voraussetzung:** Paket 04.
**Lies:** SPEC 4.2, 4.3, 5 (ingredients), 6 (Einheiten).

## Umfang
- `/zutaten`: Liste mit Suche (Name und Synonyme), Filter nach Warengruppe und „Allergene ungeprüft“. Anzeige von Warengruppe, Lieferant (abgeleitet oder abweichend), Allergene als Chips, Prüfstatus.
- Anlegen und Bearbeiten: Name, Synonyme, Warengruppe, Standardeinheit, abweichender Lieferant, 14 Allergene als Checkboxen, „Allergene geprüft“ mit Hinweistext zu verarbeiteten Produkten (SPEC 4.2), Notiz, archivieren.
- Beim Speichern prüfen, ob Name oder ein Synonym schon bei einer anderen Zutat existiert, und darauf hinweisen.
- Zusammenführen: Quellzutat wählen, Zielzutat wählen, Vorschau „X Rezepte betroffen“, dann alle Verweise umhängen und Quelle archivieren. In einer Datenbankfunktion oder Transaktion.
- `/admin/allergene`: Liste ungeprüfter Zutaten mit Schnellbearbeitung.
- Wiederverwendbare Komponente `IngredientPicker` (Suche, Treffer auch über Synonyme, „Neue Zutat anlegen“ inline mit Prüfstatus ungeprüft) für Paket 06.
- Rechte: planung und admin bearbeiten, andere lesen.

## Nicht in diesem Paket
Rezepte selbst.

## Fertig, wenn
- [ ] „Möhre“ findet „Möhren“, wenn „Möhre“ als Synonym hinterlegt ist.
- [ ] Neue Zutaten starten ungeprüft und erscheinen auf der Prüfseite.
- [ ] Zusammenführen hängt Rezeptverweise korrekt um (Test mit Testdaten).
- [ ] Prüfbefehle grün.

## Von Hand testen
1. Fünf Zutaten anlegen, eine davon mit Synonym, zwei mit Allergenen.
2. Zwei Dubletten zusammenführen.

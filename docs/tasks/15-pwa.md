# Paket 15: PWA

**Ziel:** App auf Tablet und Handys installierbar.
**Voraussetzung:** Paket 09 und 10.
**Lies:** SPEC 7, 7a (Logo, Icon).

## Umfang
- Web App Manifest über `app/manifest.ts`: Name „Pusteblume Küche“, Kurzname „Pusteblume“, Start URL `/`, Anzeige `standalone`, Hintergrund und Theme Farbe aus den Tokens.
- Icons 192, 512 und maskable aus der Pusteblume des Logos (ohne Schriftzug) auf Grundfarbe; Apple Touch Icon. Wenn das Originallogo noch fehlt: Platzhalter erzeugen und in DECISIONS.md vermerken.
- Kein Offline Caching von Daten in dieser Version; eine einfache Offline Seite „Keine Verbindung“ ist genug.
- Elternansicht bekommt ein eigenes Manifest nicht, sie ist eine normale Seite.

## Fertig, wenn
- [ ] Lighthouse PWA Prüfung ohne Fehler bei Installierbarkeit.
- [ ] Auf iPad und Android lässt sich die App zum Homescreen hinzufügen und startet ohne Browserleiste.
- [ ] Prüfbefehle grün.

## Von Hand testen
Auf dem Küchentablet „Zum Startbildschirm“ und öffnen.

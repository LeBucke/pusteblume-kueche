# Paket 13: Sicherung und Cron

**Ziel:** Keine Daten mehr verlieren, Projekt bleibt aktiv.
**Voraussetzung:** Paket 08.
**Lies:** SPEC 4.12, 7.

## Umfang
- `lib/backup.ts`: alle fachlichen Tabellen als JSON exportieren (Version, Datum, Tabellen), und eine Importfunktion mit Prüfung des Formats.
- Admin › Sicherung: „Sicherung herunterladen“ und „Sicherung einlesen“ (mit Vorschau der Mengen und Bestätigung; überschreibt nach IDs).
- `/api/cron/daily`: nur mit `Authorization: Bearer ${CRON_SECRET}`. Führt eine leichte Abfrage aus (hält Supabase aktiv), sonntags zusätzlich Sicherung in den privaten Storage Bucket `backups`, löscht ältere als die letzten 12.
- Migration für den Bucket und seine Policies (nur Service Role).
- `vercel.json` mit täglichem Cron (Zeit in UTC angeben, z. B. 03:00).

## Fertig, wenn
- [ ] Herunterladen und wieder Einlesen in ein leeres Projekt ergibt denselben Stand (Test mit Testdaten).
- [ ] Cron Route ohne Secret liefert 401.
- [ ] Prüfbefehle grün.

## Von Hand testen
1. Sicherung herunterladen und Datei ansehen.
2. Route lokal mit curl und Secret aufrufen, Datei im Bucket prüfen.

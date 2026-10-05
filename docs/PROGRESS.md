# Fortschritt

Abhaken mit Datum und einem Satz zum Stand. Reihenfolge einhalten.

- [x] 00 Grundgerüst (2026-10-05): Next.js 16 mit Tailwind 4, Design-Tokens, Rahmen mit Navigation, UI-Bausteine, Vitest; lint, typecheck, test, build grün.
- [x] 01 Rechenlogik (2026-10-05): Reine Funktionen für Daten, Einheiten, Mengen, Allergene, Rotation und Einkauf in `lib/` mit 89 Tests; lint, typecheck, test, build grün.
- [x] 02 Datenbank und Rechte (2026-10-05): 16 Tabellen mit RLS (60 Policies), Seed und DB-Typen auf Supabase eingespielt, 128 RLS-Tests je Rolle und anonym plus Trigger-Test grün (`npm run test:rls`); lint, typecheck, test, build grün.
- [x] 03 Login und Rollen (2026-10-05): Magic Link Login, Proxy mit Sitzungserneuerung, Rollen aus der Datenbank steuern Navigation, Startseite und gesperrte Routen, Seite „Kein Zugang“, Abmelden im Nutzermenü; mit Wegwerf Nutzern gegen Supabase geprüft; lint, typecheck, test, build grün.
- [ ] 04 Admin: Nutzer, Einstellungen, Lieferanten, Warengruppen
- [ ] 05 Zutaten und Allergene
- [ ] 06 Rezepte
- [ ] 07 Speiseplan
- [ ] 08 Vorlagen und Rotation
- [ ] 09 Küche: Heute
- [ ] 10 Einkauf
- [ ] 11 Elternansicht
- [ ] 12 Aushang
- [ ] 13 Sicherung und Cron
- [ ] 14 Import der alten Rezepte
- [ ] 15 PWA
- [ ] 16 Livegang

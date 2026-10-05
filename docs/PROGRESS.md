# Fortschritt

Abhaken mit Datum und einem Satz zum Stand. Reihenfolge einhalten.

- [x] 00 Grundgerüst (2026-10-05): Next.js 16 mit Tailwind 4, Design-Tokens, Rahmen mit Navigation, UI-Bausteine, Vitest; lint, typecheck, test, build grün.
- [x] 01 Rechenlogik (2026-10-05): Reine Funktionen für Daten, Einheiten, Mengen, Allergene, Rotation und Einkauf in `lib/` mit 89 Tests; lint, typecheck, test, build grün.
- [x] 02 Datenbank und Rechte (2026-10-05): 16 Tabellen mit RLS (60 Policies), Seed und DB-Typen auf Supabase eingespielt, 128 RLS-Tests je Rolle und anonym plus Trigger-Test grün (`npm run test:rls`); lint, typecheck, test, build grün.
- [x] 03 Login und Rollen (2026-10-05): Magic Link Login, Proxy mit Sitzungserneuerung, Rollen aus der Datenbank steuern Navigation, Startseite und gesperrte Routen, Seite „Kein Zugang“, Abmelden im Nutzermenü; mit Wegwerf Nutzern gegen Supabase geprüft; lint, typecheck, test, build grün.
- [x] 04 Admin: Nutzer, Einstellungen, Lieferanten, Warengruppen (2026-10-05): `/admin` mit vier Unterseiten (Einladen, Rollen, Deaktivieren, Einstellungen, Lieferanten und Warengruppen mit Reihenfolge), jede Server Action prüft die Admin Rolle selbst; gegen Supabase mit Wegwerf Nutzern geprüft, nur der erfolgreiche Mailversand der Einladung ist ohne SMTP noch ungetestet; lint, typecheck, test, build grün.
- [x] 05 Zutaten und Allergene (2026-10-05): `/zutaten` mit Suche über Name und Synonyme, Filtern, Anlegen, Bearbeiten, Archivieren und Zusammenführen (Datenbankfunktion `merge_ingredients`), Prüfseite `/admin/allergene` und wiederverwendbarer `IngredientPicker`; 24 neue Unit Tests und 10 RLS Tests für das Zusammenführen, mit Wegwerf Nutzer im Browser geprüft; lint, typecheck, test, build grün.
- [x] 06 Rezepte (2026-10-05): `/rezepte` mit Suche und Filtern, Detail mit live umgerechneten Mengen, abgeleiteten Allergenen und Druckansicht, Editor mit Tastaturbedienung, Kopie, Archivieren (Datenbankfunktion `save_recipe`); 27 neue Unit Tests und 11 RLS Tests, mit Wegwerf Nutzer im Browser geprüft; lint, typecheck, test, build grün.
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

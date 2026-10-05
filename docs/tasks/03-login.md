# Paket 03: Login und Rollen

**Ziel:** Anmeldung per Magic Link, geschützte Bereiche, Navigation und Startseite je Rolle.
**Voraussetzung:** Paket 02; docs/SETUP.md „Vor Paket 03“.
**Lies:** SPEC 2, 4.1, 7a (Navigation).

## Umfang
- `lib/supabase/server.ts`, `client.ts`, `admin.ts` nach aktuellem `@supabase/ssr` Muster; Middleware, die die Sitzung erneuert.
- `/login`: Mailadresse eingeben, `signInWithOtp` mit `shouldCreateUser: false`, Bestätigungstext „Schau in dein Postfach“. Fehler verständlich anzeigen (z. B. unbekannte Adresse ohne zu verraten, ob es sie gibt).
- `/auth/callback`: Code eintauschen, weiterleiten auf die Startseite der Rolle.
- Alle Teamrouten nur mit Sitzung und aktivem Profil. Inaktiv oder ohne Rollen: Seite „Kein Zugang, bitte an den Vorstand wenden“.
- Navigation zeigt nur, was die Rollen dürfen. Startseite nach Rolle (SPEC 7a). Mehrere Rollen: Reihenfolge planung, kueche, einkauf, admin.
- Abmelden im Nutzermenü.
- Deutsche Mailvorlage für den Magic Link und die Einladung als Text in `docs/mail-vorlagen.md`, damit Paul sie in Supabase einfügt.
- Anleitung in `docs/SETUP.md` ergänzen: ersten Admin per SQL setzen (`update profiles set roles = '{admin,planung}' where ...`).

## Nicht in diesem Paket
Nutzer einladen über die Oberfläche (Paket 04).

## Fertig, wenn
- [ ] Anmelden, Neuladen, Abmelden funktioniert; Sitzung bleibt über Tage erhalten.
- [ ] Ohne Anmeldung landet jede Teamroute auf `/login`.
- [ ] Eine Person nur mit Rolle einkauf sieht nur Heute, Speiseplan, Rezepte (lesen) und Einkauf und landet auf `/einkauf`.
- [ ] Prüfbefehle grün.

## Von Hand testen
1. Mit deiner Adresse anmelden, Mail kommt an, Link führt in die App.
2. In Supabase deine Rollen ändern, neu laden, Navigation passt sich an.

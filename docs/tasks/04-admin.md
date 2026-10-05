# Paket 04: Admin: Nutzer, Einstellungen, Lieferanten, Warengruppen

**Ziel:** Der Admin kann Leute einladen, Rollen vergeben und die Grunddaten pflegen.
**Voraussetzung:** Paket 03; docs/SETUP.md „Vor Paket 04“ (SMTP).
**Lies:** SPEC 2, 4.1, 4.11, 5.

## Umfang
- `/admin` mit Unterseiten Nutzer, Einstellungen, Lieferanten, Warengruppen. Nur für Rolle admin (Route und Server Actions prüfen beide).
- Nutzer: Liste mit Name, Mail, Rollen, aktiv. Einladen (Name, Mail, Rollen) per Server Action mit `auth.admin.inviteUserByEmail` und Redirect auf `/auth/callback`. Rollen ändern, deaktivieren, erneut einladen. Der letzte aktive Admin kann sich nicht selbst entfernen.
- Einstellungen: Standard Kinder, Erwachsene, Erwachsenenfaktor. Rotation und Elternansicht nur als Platzhalter Abschnitt („kommt in Paket 08/11“), nicht umsetzen.
- Lieferanten: anlegen, umbenennen, Kontakt und Notiz, Reihenfolge.
- Warengruppen: anlegen, umbenennen, Standardlieferant, Reihenfolge. Löschen nur, wenn keine Zutat sie nutzt.
- Validierung mit zod, verständliche Fehlermeldungen auf Deutsch.

## Nicht in diesem Paket
Zutaten, Rezepte.

## Fertig, wenn
- [ ] Einladung kommt an, eingeladene Person landet mit den richtigen Rollen in der App.
- [ ] Nicht Admins kommen weder per Navigation noch per direkter URL oder Server Action an Admin Funktionen.
- [ ] Prüfbefehle grün.

## Von Hand testen
1. Eine zweite eigene Adresse mit Rolle einkauf einladen, anmelden, prüfen.
2. Reihenfolge der Warengruppen ändern.

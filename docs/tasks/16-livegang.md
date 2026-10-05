# Paket 16: Livegang

**Ziel:** App läuft auf Vercel mit der echten Datenbank, die Teams können starten.
**Voraussetzung:** alle vorherigen Pakete; docs/SETUP.md „Vor Paket 16“.
**Lies:** SPEC 1, 7, 11.

## Umfang
- `vercel.json` prüfen: Functions Region `fra1`, Cron aus Paket 13.
- Liste der Umgebungsvariablen für Vercel in `docs/SETUP.md` ergänzen.
- Anleitung für Paul in `docs/SETUP.md`: Supabase Site URL und Redirect URL auf die echte Domain umstellen, SMTP prüfen, Elternansicht aktivieren.
- `README.md` für Vorstand und Admins in einfacher Sprache: was die App macht, wo die Konten liegen, wie man Nutzer einlädt, wie man eine Sicherung zieht, wen man bei Problemen fragt.
- Smoke Test Checkliste `docs/smoke-test.md`: Login je Rolle, Rezept anlegen, Tag planen, Einkauf abhaken auf zwei Geräten, Elternlink, Aushang, Cron einmal manuell auslösen.

## Fertig, wenn
- [ ] Produktion erreichbar, Login funktioniert mit echter Domain.
- [ ] Smoke Test vollständig abgehakt.

## Von Hand testen
Die Smoke Test Liste gemeinsam mit je einer Person aus Küche, Einkauf und Planung durchgehen.

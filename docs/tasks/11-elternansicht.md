# Paket 11: Elternansicht

**Ziel:** Öffentlicher Wochenplan und Rezepte zum Nachkochen ohne Login.
**Voraussetzung:** Paket 07.
**Lies:** SPEC 4.9, 5 (settings, RLS Hinweis); docs/design/eltern-woche.dc.html, eltern-rezept.dc.html.

## Umfang
- Migration: Postgres Funktionen `get_public_week(token, week_start)`, `get_public_recipe(token, recipe_id)`, `search_public_recipes(token, query)` als `security definer` mit festem `search_path`. Sie prüfen `public_enabled` und Token und liefern nur freigegebene Felder (keine internen Notizen, keine Hinweise, Autor nur wenn `public_show_author`). Ausführbar für `anon`.
- Admin › Einstellungen › Elternansicht: an/aus, Token erzeugen und erneuern (mindestens 128 Bit, `crypto.randomBytes`), Standardhaushalt, Autor anzeigen, Link und QR Code (z. B. Paket `qrcode`, als SVG anzeigen und herunterladbar).
- `/e/[token]`: Wochenplan aktuelle und nächste Woche wie Vorlage, Pastellkreise, Hinweis bei unvollständigen Allergenen, Links zu Impressum und Datenschutz der Kita Website.
- `/e/[token]/rezept/[id]`: Rezept mit Haushaltsgröße (Standard aus Einstellungen, Eingabe mit Plus und Minus, im localStorage gemerkt), Mengen über `formatAmount(..., 'parents')`, Hinweistext aus SPEC.
- `/e/[token]/rezepte`: Suche über alle nicht archivierten Rezepte.
- Ungültiger oder abgeschalteter Token: freundliche Seite ohne Details.
- `noindex` Header und Meta, keine Cookies setzen, kein Supabase Login auf diesen Routen.

## Fertig, wenn
- [ ] Mit falschem Token kommen keine Daten, auch nicht über direkte RPC Aufrufe.
- [ ] Token erneuern macht den alten Link sofort ungültig.
- [ ] Antwort der Funktionen enthält nachweislich keine internen Felder (Test).
- [ ] Prüfbefehle grün.

## Von Hand testen
1. QR Code mit dem Handy scannen, Wochenplan und Rezept öffnen, Haushalt auf 2/3 stellen.
2. Token erneuern, alten Link prüfen.

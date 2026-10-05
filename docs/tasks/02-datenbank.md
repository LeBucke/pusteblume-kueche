# Paket 02: Datenbank und Rechte

**Ziel:** Vollständiges Schema mit Row Level Security auf dem Supabase Projekt, Seed Daten und erzeugte Typen.
**Voraussetzung:** Paket 01; docs/SETUP.md „Vor Paket 02“ (Projekt verknüpft, .env.local gefüllt).
**Lies:** SPEC 2, 4.3, 4.9 (öffentliche Funktionen), 5.

## Umfang
- Supabase CLI Struktur (`supabase/config.toml`, `supabase/migrations/`), falls noch nicht da.
- Migration 1: Enums, alle Tabellen aus SPEC 5 mit Fremdschlüsseln, `created_at`/`updated_at` (Trigger), `updated_by` wo genannt, sinnvolle Indizes (z. B. `plan_meals(recipe_id)`, `recipe_ingredients(ingredient_id)`), Erweiterung `citext`.
- Migration 2: `has_role(app_role)` als `security definer` mit festem `search_path`, RLS auf allen Tabellen, Policies exakt nach der Tabelle in SPEC 5. Nutzer mit `active = false` dürfen nichts.
- Migration 3: Trigger, der beim Anlegen eines Auth Nutzers ein Profil erzeugt (Name aus Metadaten oder Mailadresse, Rollen aus Metadaten `roles`, sonst leer).
- Allergene als `check` Constraint auf die 14 Schlüssel aus `lib/allergens.ts`.
- `supabase/seed.sql`: Einstellungen (eine Zeile), Lieferanten „Bio-Bauer“ und „Großhandel“, Warengruppen aus SPEC 3 mit Standardlieferant (Gemüse, Obst, Milchprodukte beim Bio-Bauer, Rest Großhandel). Idempotent.
- Öffentliche Funktionen erst als leere Hülle anlegen ist NICHT nötig, kommen in Paket 11.
- Typen erzeugen nach `lib/database.types.ts`, `lib/types.ts` darauf umstellen, wo sinnvoll.
- `supabase/tests/rls.sql` oder ein Vitest Integrationstest, der mit Testnutzern je Rolle prüft: einkauf darf keine Rezepte ändern, kueche darf kitchen_feedback schreiben, Anonyme sehen nichts.

## Nicht in diesem Paket
Login Oberfläche, öffentliche Elternfunktionen, Storage.

## Fertig, wenn
- [ ] `npx supabase db push` läuft fehlerfrei, Seed ist eingespielt.
- [ ] Jede Tabelle hat RLS aktiv (Abfrage auf `pg_tables`/`pg_class` im Plan zeigen).
- [ ] RLS Tests für alle vier Rollen und anonym laufen grün.
- [ ] Typen sind erzeugt, Prüfbefehle grün.

## Von Hand testen
1. Supabase › Table Editor: Tabellen und Seed Daten ansehen.
2. Supabase › Authentication › Policies: jede Tabelle hat Policies.

**Hinweis für Paul:** Das ist das sicherheitskritischste Paket. Nach Abschluss lohnt eine zweite Durchsicht, z. B. in einer neuen Sitzung: „Prüfe die RLS Policies in supabase/migrations gegen SPEC Abschnitt 5 und suche Lücken.“

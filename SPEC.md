# Pusteblume Küche: Spezifikation Version 1

Webanwendung für die Kita Pusteblume e.V. in Kempen zur Verwaltung von Rezepten, Speiseplan und Einkauf. Ersetzt die nicht mehr erreichbare Seite pusteblume.kita-rezepte.de.

Sprache der Oberfläche: Deutsch. Code, Tabellen und Variablen: Englisch.

## 1. Ziel und Rahmen

Die Kita kocht täglich selbst für etwa 20 Kinder und 5 Erwachsene, saisonal und in Bioqualität. Gemüse und Milchprodukte kommen wöchentlich von einem regionalen Biobauern, Grundnahrungsmittel über einen Biogroßhandel.

Die Anwendung soll:

- Rezepte zentral pflegen, mit Mengen, die automatisch auf die Gruppengröße umgerechnet werden
- den Speiseplan monatlich planen, auch über wiederkehrende Wochenvorlagen
- der Köchin eine klare Tagesansicht geben
- dem Einkaufsteam eine summierte Einkaufsliste je Lieferant liefern
- Eltern den Speiseplan mit Allergenen ohne Login zeigen
- dauerhaft wartbar bleiben, auch wenn die heutigen Eltern die Kita verlassen

Betrieb: Konten für GitHub, Vercel, Supabase und Domain laufen auf eine Mailadresse der Kita, nicht auf eine Privatperson. Zugangsdaten liegen beim Vorstand.

## 2. Nutzer, Geräte und Rollen

| Rolle | Wer | Gerät | Darf |
|---|---|---|---|
| admin | Vorstand, technische Betreuung | Laptop | alles, inkl. Nutzer, Einstellungen, Lieferanten, Warengruppen, Sicherung |
| planung | Team Rezeptplanung | Laptop | Rezepte, Zutaten, Speiseplan, Vorlagen, Rotation bearbeiten |
| kueche | Köchin, Küchentablet | Tablet | alles lesen, Rückmeldung zum Tag schreiben |
| einkauf | Einkaufsteam | Handy | alles lesen, Einkaufslisten abhaken, Zusatzartikel |

Eine Person kann mehrere Rollen haben. Alle angemeldeten, aktiven Nutzer dürfen alles lesen. Das Küchentablet bekommt ein eigenes Konto mit Rolle `kueche`.

Kein offenes Registrieren. Nur der Admin lädt per Mail ein.

## 3. Begriffe

- **Gang**: `vorspeise`, `hauptgang`, `nachtisch`. Pro Tag höchstens ein Rezept je Gang.
- **Grundmenge**: Für wie viele Kinder und Erwachsene ein Rezept geschrieben ist (Standard 20 und 5).
- **Erwachsenenfaktor**: Eine Erwachsenenportion entspricht X Kinderportionen (Standard 1,5).
- **Warengruppe**: z. B. Gemüse, Obst, Milchprodukte, Getreide und Teigwaren, Grundnahrungsmittel, Gewürze, Tiefkühl, Konserven. Jede Warengruppe hat einen Standardlieferanten.
- **Lieferant**: z. B. Biobauer, Großhandel. Bestimmt die Aufteilung der Einkaufsliste.
- **Wochenvorlage**: Benannte Woche mit Gerichten für Montag bis Freitag und drei Gänge.
- **Rotation**: Geordnete Liste von Wochenvorlagen, die sich ab einem Startmontag zyklisch wiederholt.

## 4. Funktionen Version 1

### 4.1 Anmeldung und Nutzerverwaltung

- Login per Magic Link (`signInWithOtp` mit `shouldCreateUser: false`).
- Admin lädt Nutzer per Mail ein, vergibt Rollen und kann Nutzer deaktivieren. Einladung über Server Action mit `auth.admin.inviteUserByEmail`, Profil wird dabei angelegt.
- Lange Sitzungen, damit Tablet und Handys nicht ständig neu anmelden müssen.
- Eigener SMTP Versand ist Pflicht (Kita Postfach oder Dienst wie Resend). Der Standardversand von Supabase ist nur für Tests gedacht und stark limitiert.

Fertig, wenn: Admin lädt eine Person mit Rolle `einkauf` ein, sie meldet sich an und kann keine Rezepte ändern, auch nicht über direkte API Aufrufe (RLS greift).

### 4.2 Stammdaten: Zutaten, Warengruppen, Lieferanten

Zutaten sind eigene Datensätze und werden in Rezepten nur referenziert.

Zutat: Name (eindeutig, ohne Groß und Kleinschreibung), Synonyme, Warengruppe, Standardeinheit, optional abweichender Lieferant, **Allergene**, Kennzeichen **Allergene geprüft**, Notiz, archiviert.

- Beim Erfassen eines Rezepts kann direkt eine neue Zutat angelegt werden. Sie startet mit `allergens_checked = false`.
- Admin Seite „Allergene prüfen“ listet alle ungeprüften Zutaten.
- Hinweis in der Oberfläche: Bei verarbeiteten Produkten (Brühe, Nudeln, Brot) gelten die Allergene des tatsächlich gekauften Produkts. Wechselt das Produkt, muss die Zutat neu geprüft werden.
- Suche beim Erfassen trifft auch Synonyme (z. B. „Möhre“ findet „Möhren“), damit keine Dubletten entstehen.
- Zusammenführen von zwei Zutaten (Admin, Planung): alle Rezeptverweise wandern auf die Zielzutat.

Warengruppen und Lieferanten pflegt der Admin, inklusive Reihenfolge für die Einkaufsliste.

### 4.3 Allergene

Die 14 Hauptallergene nach LMIV als feste Liste im Code:
Glutenhaltiges Getreide, Krebstiere, Eier, Fisch, Erdnüsse, Soja, Milch, Schalenfrüchte, Sellerie, Senf, Sesam, Schwefeldioxid und Sulfite, Lupinen, Weichtiere.

- Allergene eines Rezepts = Vereinigung der Allergene aller Zutaten. Sie werden nicht am Rezept gespeichert, sondern immer abgeleitet.
- Ist mindestens eine Zutat ungeprüft, gilt das Rezept als **Allergenangaben unvollständig**. Das wird im Rezept, im Speiseplan, im Aushang und in der Elternansicht sichtbar markiert. Ungeprüft darf nie wie „allergenfrei“ aussehen.
- Allergene eines Tages = Vereinigung über alle Gänge.

### 4.4 Rezepte

Felder: Name, Gang, Kategorie (frei mit Vorschlägen), Grundmenge Kinder und Erwachsene, Kurzbeschreibung, Autor, Zutatenliste (Zutat, Menge oder leer für „nach Bedarf“, Einheit, Notiz wie „gewürfelt“, Reihenfolge), Zubereitung (jede Zeile ein Schritt), Hinweise.

- Liste mit Suche (Name, Kategorie, Zutat) und Filtern (Gang, Kategorie, „ohne Allergen X“).
- Detailansicht mit Eingabe für Kinder und Erwachsene, Mengen rechnen live um.
- „Kopie anlegen“ für Varianten (z. B. reduzierte Menge).
- Archivieren statt Löschen, weil Pläne und Vorlagen auf Rezepte verweisen. Archivierte Rezepte erscheinen nicht in Auswahllisten, bleiben in alten Plänen sichtbar.
- Anzeige „zuletzt gekocht am“ und „nächster geplanter Termin“.
- Druckansicht eines Rezepts mit umgerechneten Mengen.

### 4.5 Speiseplan

- Monatsansicht (Montag bis Freitag) und Wochenansicht.
- Tag bearbeiten: drei Gänge wählen, Notiz intern, Notiz für Eltern, „Kita geschlossen“ mit Grund, abweichende Anzahl Kinder und Erwachsene.
- Auswahlliste je Gang zeigt zuerst Rezepte dieses Gangs nach Kategorie gruppiert, dann die übrigen. Hinter jedem Rezept steht, wann es zuletzt lief.
- Woche kopieren auf eine andere Woche.
- Zelle zeigt Gerichte, Allergenkurzform, abweichende Anzahl und Warnung bei unvollständigen Allergenen.

### 4.6 Wochenvorlagen und Rotation

- Vorlage anlegen, bearbeiten, umbenennen, archivieren. Eine bestehende Planwoche kann als Vorlage gespeichert werden.
- Vorlage auf eine Woche anwenden.
- Rotation: geordnete Liste von Vorlagen plus Startmontag in den Einstellungen. Die Woche mit Montag M nutzt die Vorlage an Position `floor((M - start) / 7) mod n`. Die Rotation folgt also dem Kalender, Ferien verschieben sie nicht.
- „Rotation anwenden“ für einen Zeitraum: zeigt erst eine Vorschau, füllt dann nur leere Gänge, überschreibt nichts und lässt geschlossene Tage aus.
- Vorlagen mit archivierten Rezepten werden markiert.

### 4.7 Küche (Startseite für Rolle kueche)

- Tagesansicht mit großer Schrift: Datum, Gruppengröße, interne Notiz, je Gang Name, Allergene, umgerechnete Zutaten, Zubereitungsschritte.
- Wochenleiste zum Springen, Pfeile für Vortag und Folgetag (Wochenenden werden übersprungen).
- Bildschirm bleibt an (Screen Wake Lock API, wenn verfügbar).
- Rückmeldung je Gang: Menge (zu wenig, passt, zu viel), kam gut an (ja, geht so, nein), Freitext. Rückmeldungen erscheinen beim Rezept und helfen der Planung.

### 4.8 Einkauf

- Zeitraum wählen: Startdatum und Anzahl Tage (Standard: aktuelle Woche, 7 Tage). Schnellwahl vorige und nächste Woche.
- Liste der geplanten Gerichte im Zeitraum.
- Mengen je Zutat summiert (siehe Abschnitt 6), gruppiert nach Lieferant und darunter nach Warengruppe.
- Unter jeder Position klein: in welchen Rezepten sie vorkommt.
- Abhaken, live für alle Geräte (Supabase Realtime). Wer wann abgehakt hat, wird gespeichert.
- Zusatzartikel je Liste (Freitext, abhakbar, löschbar).
- Abschnitt „Vorrat prüfen“ für Zutaten ohne Menge (Salz, Gewürze).
- „Als Text kopieren“ je Lieferant, nur offene Positionen, schlichtes Format ohne Sonderzeichen:

  ```
  Einkauf Biobauer für 12.10. bis 16.10.

  Gemüse
  Kartoffeln: 8,5 kg
  Möhren: 5,8 kg
  ```

- Wird der Plan nach dem Abhaken geändert, bleiben Haken an unveränderten Positionen erhalten. Positionen, deren Menge sich geändert hat, werden markiert.
- Druckansicht.

### 4.9 Elternansicht

- Öffentliche Route `/e/[token]` ohne Login, Token zufällig (mindestens 128 Bit), vom Admin erneuerbar und abschaltbar.
- Zeigt aktuelle und nächste Woche: Gerichte, Allergene ausgeschrieben, geschlossene Tage, Notiz für Eltern.
- Jedes Gericht ist antippbar und öffnet das Rezept zum Nachkochen: Zutaten, Zubereitung, Allergene.
- Mengen sind auf Haushaltsgröße umgerechnet, Standard 2 Erwachsene und 2 Kinder, einstellbar über zwei Eingaben. Die Einstellung merkt sich der Browser (localStorage), sonst wird nichts gespeichert.
- Kurzer Hinweis unter den Zutaten: Mengen sind aus der Kita Menge umgerechnet, Gewürze nach Geschmack, Garzeiten können bei kleinen Mengen kürzer sein.
- Zusätzlich eine Rezeptsammlung mit Suche über alle nicht archivierten Rezepte, damit Eltern auch Lieblingsgerichte aus früheren Wochen finden.
- Nicht sichtbar: interne Notizen, Hinweise am Rezept, Küchenrückmeldungen, Rotation, Einkauf. Ob der Autor eines Rezepts angezeigt wird, regelt eine Einstellung (Standard: aus).
- Hinweis bei unvollständigen Allergenangaben: „Allergenangaben werden noch geprüft, bitte in der Kita nachfragen.“
- Admin Seite erzeugt QR Code und Link zum Aushängen.
- `noindex`, keine Cookies, kein Tracking. Link auf Impressum und Datenschutz der Kita Website.
- Datenzugriff ausschließlich über Postgres Funktionen mit `security definer`, die nur die freigegebenen Felder liefern: `get_public_week(token, week_start)`, `get_public_recipe(token, recipe_id)` und `search_public_recipes(token, query)`.

### 4.10 Aushang

- Druckoptimierte Seite für eine Woche, A4 quer, mit Gerichten je Tag, Allergenen und Legende. Ausgabe als PDF über den Druckdialog des Browsers, keine PDF Bibliothek nötig.

### 4.11 Einstellungen (Admin)

Standardanzahl Kinder und Erwachsene, Erwachsenenfaktor, Lieferanten, Warengruppen mit Standardlieferant, Rotation (Startmontag, Reihenfolge der Vorlagen), Elternansicht (an/aus, Token erneuern, QR Code, Standardhaushalt, Autor anzeigen).

### 4.12 Sicherung und Import

- Admin kann alle Daten als eine JSON Datei herunterladen und wieder einlesen.
- Täglicher Vercel Cron (`/api/cron/daily`, geschützt mit `CRON_SECRET`): hält das Supabase Projekt aktiv (kostenlose Projekte pausieren nach einer Woche ohne Aktivität) und schreibt sonntags eine vollständige Sicherung in einen privaten Storage Bucket `backups`. Die letzten 12 Sicherungen bleiben erhalten.
- Import der alten Daten siehe Abschnitt 8.

## 5. Datenmodell

Alle Tabellen mit `created_at`, `updated_at` und wo sinnvoll `updated_by`. IDs als `uuid` mit `gen_random_uuid()`.

```sql
create type app_role as enum ('admin','planung','kueche','einkauf');
create type course as enum ('vorspeise','hauptgang','nachtisch');

profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  roles app_role[] not null default '{}',
  active boolean not null default true
)

settings (            -- genau eine Zeile
  id int primary key default 1 check (id = 1),
  default_children int not null default 20,
  default_adults int not null default 5,
  adult_factor numeric not null default 1.5,
  rotation_start date,               -- ein Montag
  public_enabled boolean not null default false,
  public_token text unique,
  public_show_author boolean not null default false,
  public_default_children int not null default 2,
  public_default_adults int not null default 2
)

suppliers (id, name text unique not null, contact text, notes text, sort int)

product_groups (id, name text unique not null,
  default_supplier_id uuid references suppliers, sort int)

ingredients (
  id, name citext unique not null, aliases text[] not null default '{}',
  product_group_id uuid references product_groups,
  default_unit text,
  supplier_id uuid references suppliers,      -- optional, überschreibt Warengruppe
  allergens text[] not null default '{}',     -- Schlüssel aus fester Liste
  allergens_checked boolean not null default false,
  notes text, archived boolean not null default false
)

recipes (
  id, name text not null, course course not null, category text,
  base_children int not null default 20, base_adults int not null default 5,
  description text, author text, steps text, notes text,
  legacy_allergens text[],            -- nur aus Import, zum Abgleich
  archived boolean not null default false
)

recipe_ingredients (
  id, recipe_id uuid references recipes on delete cascade,
  ingredient_id uuid references ingredients not null,
  amount numeric,                     -- null = nach Bedarf
  unit text, note text, sort int not null default 0
)

plan_days (
  date date primary key,
  closed boolean not null default false, closed_reason text,
  note_internal text, note_public text,
  children int, adults int            -- null = Standard
)

plan_meals (
  date date not null, course course not null,
  recipe_id uuid references recipes not null,
  primary key (date, course)
)

week_templates (id, name text not null, notes text, archived boolean default false)

week_template_meals (
  template_id uuid references week_templates on delete cascade,
  weekday smallint check (weekday between 1 and 5),
  course course, recipe_id uuid references recipes,
  primary key (template_id, weekday, course)
)

rotation_entries (position int primary key, template_id uuid references week_templates)

shopping_lists (id, start_date date not null, days int not null,
  unique (start_date, days))

shopping_checks (
  list_id uuid references shopping_lists on delete cascade,
  item_key text,                      -- '<ingredient_id>:<base_unit>'
  checked boolean not null, amount_at_check numeric,
  checked_by uuid, checked_at timestamptz,
  primary key (list_id, item_key)
)

shopping_extras (id, list_id uuid references shopping_lists on delete cascade,
  text text not null, done boolean not null default false, created_by uuid)

kitchen_feedback (
  date date, course course,
  amount_rating text check (amount_rating in ('zu_wenig','passt','zu_viel')),
  liked text check (liked in ('ja','geht_so','nein')),
  note text, created_by uuid,
  primary key (date, course)
)
```

### Row Level Security

Hilfsfunktion `has_role(r app_role) returns boolean` (`security definer`, prüft `profiles.roles` und `active`).

| Tabellen | Lesen | Schreiben |
|---|---|---|
| alle | aktive angemeldete Nutzer | siehe unten |
| recipes, recipe_ingredients, ingredients, plan_days, plan_meals, week_templates, week_template_meals, rotation_entries | | planung, admin |
| shopping_lists, shopping_checks, shopping_extras | | einkauf, planung, admin |
| kitchen_feedback | | kueche, planung, admin |
| profiles, settings, suppliers, product_groups | | admin |

Die Elternansicht greift nie direkt auf Tabellen zu, nur über die öffentlichen Funktionen aus 4.9.

## 6. Mengenberechnung

**Faktor** für ein Rezept an einem Tag:

```
portionen(k, e) = k + e * adult_factor
faktor = portionen(Tag) / portionen(Grundmenge des Rezepts)
```

Tag nutzt `plan_days.children/adults`, sonst die Standardwerte aus `settings`.

**Einheiten** (feste Liste): `g`, `kg`, `ml`, `l`, `St.`, `Pckg.`, `Dose`, `Glas`, `Bund`, `EL`, `TL`, `Prise`.
Basiseinheiten: Masse in `g`, Volumen in `ml`, alle anderen bleiben, wie sie sind.

**Summieren** in der Einkaufsliste: Schlüssel ist Zutat plus Basiseinheit. Kommt dieselbe Zutat in verschiedenen Einheitenfamilien vor (z. B. Möhren in g und in St.), entstehen zwei Zeilen mit Hinweis.

**Runden und Anzeigen:**

- g und ml: unter 100 auf ganze Zahlen, ab 100 auf Zehner; ab 1000 Anzeige in kg oder l mit einer Nachkommastelle.
- Stückeinheiten: im Rezept auf halbe Stücke, in der Einkaufsliste immer auf ganze Stücke aufrunden. In der Elternansicht mindestens ein halbes Stück, nie 0.
- EL, TL, Prise: eine Nachkommastelle.
- Zahlen im deutschen Format (Komma).

Diese Logik liegt in reinen Funktionen (`lib/quantities.ts`) mit Unit Tests.

## 7. Technik

- Next.js (App Router) mit TypeScript, Tailwind CSS, Server Actions, Validierung mit zod.
- Supabase: Postgres, Auth, Realtime (Einkaufsliste), Storage (Sicherungen). Paket `@supabase/ssr`.
- Hosting: Vercel, Functions in Region `fra1`. Supabase Projekt in Frankfurt.
- PWA Manifest und Icon, damit Tablet und Handys die Seite auf den Homescreen legen können.
- Migrationen über Supabase CLI im Repo (`supabase/migrations`), Seed Daten für Warengruppen, Lieferanten und Allergene.
- Tests: Vitest für Mengenberechnung, Summierung, Rotation und Allergenableitung.

Umgebungsvariablen:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY        # bzw. publishable key
SUPABASE_SERVICE_ROLE_KEY            # bzw. secret key, nur serverseitig
CRON_SECRET
```

Vorgeschlagene Struktur:

```
app/
  (auth)/login
  (app)/heute
  (app)/plan
  (app)/rezepte
  (app)/zutaten
  (app)/vorlagen
  (app)/einkauf
  (app)/admin
  druck/woche/[start]
  e/[token]
  api/cron/daily
lib/
  quantities.ts  allergens.ts  rotation.ts  supabase/
supabase/
  migrations/  seed.sql
```

Gestaltung: siehe Abschnitt 7a. Der Prototyp unter claude.ai dient als Vorlage für Abläufe, die Designentwürfe (Küche, Speiseplan, Einkauf, Eltern Wochenplan, Eltern Rezept) als Vorlage für das Aussehen.

## 7a. Gestaltung

Angelehnt an das Erscheinungsbild der Kita (Logo, Flyer): warmer Naturton als Grund, Logogrün für Aktionen, Pastellkreise als Markenzeichen.

**Farben (Tailwind Theme oder CSS Variablen):**

| Token | Hex | Verwendung |
|---|---|---|
| ground | #F3F0E7 | Seitenhintergrund |
| surface | #FFFDF8 | Karten, Eingabefelder, aktive Tabs |
| line | #E2DCCD | Rahmen, Trennlinien (#ECE6D8 innerhalb von Karten) |
| ink | #2F3527 | Text |
| muted | #5B5A4C | Nebentext, inaktive Navigation |
| primary | #5F7C2B | Logogrün: Hauptbuttons, Fortschritt, aktiver Rahmen |
| primary-ink | #4F6A22 | grüne Links und Beschriftungen |
| course-starter | #B5CCB2 | Vorspeise (Punkt), Salbei |
| course-main | #F4D779 | Hauptgang (Punkt), Gelb; Fläche „heute“ #FAEBC0, Text darauf #6E5612, Rahmen #E2C55E |
| course-dessert | #C9B5D9 | Nachtisch (Punkt), Flieder; Fläche #E6DDEA, Text darauf #5E4A78 |
| allergen | #F6E1D0 | Allergenchips, Text darauf #8A5430 |
| info | #D7EAED | Rückmeldungen, Text darauf #2F6670 |
| closed | #EAD8B2 | geschlossene Tage, Text darauf #6E5612 |
| deko | #B3D6DC, #F4D779, #EAD8B2, #B5CCB2, #D1C4D6, #E9BE9C | Pastellkreise |

Regeln: Pastelltöne nie als Schriftfarbe auf dem Grund (zu wenig Kontrast), nur als Flächen und Punkte; Text darauf immer in der dunklen Variante. Gänge werden überall mit demselben farbigen Punkt gekennzeichnet. Dunkler Modus folgt in einer späteren Version.

**Schrift:** Dosis (600, 700) für Überschriften, Datumsangaben, Buttons und Mengen; Nunito (400, 700, 800) für Fließtext. Beides über Google Fonts bzw. `next/font`. Die Elternansicht darf große Überschriften in Versalien setzen wie auf den Flyern, die Teamansichten nicht.

**Formen:** Karten mit 18 bis 24 px Radius, Buttons, Chips und Tabs voll abgerundet. Keine Schatten, Abgrenzung über Flächenfarbe und feine Rahmen. Bedienelemente mindestens 44 px hoch, in der Küche 46 bis 52 px.

**Kreise:** In der Elternansicht mehrere Pastellkreise angeschnitten an den Rändern, in den Teamansichten höchstens einer, damit die Arbeitsscreens ruhig bleiben.

**Logo:** Originaldatei der Kita verwenden (möglichst SVG), grüne Fassung auf hellem Grund. Als PWA Icon die Pusteblume aus dem Logo ohne Schriftzug auf #F3F0E7.

**Navigation:** Teamansichten mit Logo links und Navigation als Pillen (Heute, Speiseplan, Rezepte, Vorlagen, Einkauf, Admin je nach Rolle). Auf dem Handy als untere Leiste. Startseite nach Rolle: Küche landet auf Heute, Einkauf auf Einkauf, Planung auf Speiseplan.

## 8. Import der alten Daten

Quelle 1: Sicherungsdatei des Prototyps (`pusteblume-sicherung-*.json`):

```json
{
  "app": "pusteblume-kueche", "version": 1,
  "einstellungen": { "kinder": 20, "erwachsene": 5, "faktorErw": 1.5,
    "lieferanten": ["Bio-Bauer", "Großhandel"], "zuordnung": { "Gemüse": "Bio-Bauer" } },
  "rezepte": { "<id>": { "name": "", "gang": "hauptgang", "kategorie": "",
    "kinder": 20, "erwachsene": 5, "beschreibung": "", "autor": "",
    "zutaten": [ { "menge": 1500, "einheit": "g", "name": "Möhren", "gruppe": "Gemüse" } ],
    "zubereitung": "", "allergene": ["Milch"], "notizen": "" } },
  "plan": { "2026-10-05": { "geschlossen": false, "notiz": "",
    "vorspeise": "<id>", "hauptgang": "<id>", "nachtisch": "<id>",
    "kinder": 18, "erwachsene": 5 } }
}
```

Quelle 2: weitere Rezepte der alten Seite aus Webarchiv, Suchindex oder einem Export des Betreibers, vorher in dasselbe Format gebracht.

Importregeln (Admin Seite, einmalig nutzbar, auch erneut ausführbar):

- Zutaten über normalisierten Namen und Synonyme zuordnen, fehlende neu anlegen mit `allergens_checked = false`.
- Alte Rezeptallergene in `legacy_allergens` übernehmen.
- Abgleichsseite: Rezepte, bei denen abgeleitete Allergene und `legacy_allergens` abweichen. So lassen sich die Zutatenallergene schnell korrekt setzen.
- Vorschau mit Anzahl neuer Rezepte, Zutaten und Plantage, dann erst schreiben.

## 9. Meilensteine

1. **Grundgerüst**: Repo, Supabase, Migrationen, Login, Einladung, Rollen, RLS, Navigation. Fertig, wenn Rechte je Rolle nachweislich greifen.
2. **Stammdaten und Rezepte**: Zutaten, Warengruppen, Lieferanten, Allergenableitung, Rezeptverwaltung mit Umrechnung.
3. **Speiseplan und Küche**: Monats und Wochenansicht, Tag bearbeiten, Woche kopieren, Vorlagen, Rotation, Küchenansicht mit Rückmeldung.
4. **Einkauf**: Summierung, Lieferanten, Abhaken in Echtzeit, Zusatzartikel, Text kopieren, Druck.
5. **Eltern, Aushang, Sicherung, Import**: Elternansicht mit QR Code, Aushang, Cron, Export und Import, Allergenabgleich.
6. **Testbetrieb**: zwei bis drei Wochen parallel mit allen Teams, danach Feinschliff.

## 10. Später

- Gebindegrößen je Zutat, Einkaufsliste rundet auf ganze Gebinde
- Preise je Zutat, Kosten pro Mahlzeit und Monat
- Bestellstatus je Lieferant (bestellt, geliefert)
- Fotos zu Rezepten
- Abgleich des Plans mit dem DGE Qualitätsstandard für Kitas
- Auswertung der Küchenrückmeldungen je Rezept

## 11. Offene Punkte

- Vercel Hobby ist nur für nicht kommerzielle, persönliche Nutzung. Für einen gemeinnützigen Verein ohne Einnahmen vermutlich in Ordnung, einmal beim Vercel Support bestätigen lassen.
- Mailadresse der Kita für alle Konten festlegen.
- SMTP Dienst für den Mailversand festlegen.
- Auftragsverarbeitungsverträge mit Supabase und Vercel abschließen (beide bieten einen an), kurzer Datenschutzhinweis für die Nutzer.
- Namen der Lieferanten und Zuordnung der Warengruppen mit dem Einkaufsteam abstimmen.
- Startmontag und erste Vorlagen der Rotation mit dem Planungsteam festlegen.

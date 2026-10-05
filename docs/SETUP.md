# Einrichtung (macht Paul von Hand)

Diese Schritte brauchen Konten und Passwörter und werden deshalb nicht von Claude Code erledigt.

## Vor Paket 00

1. Node.js LTS (20 oder neuer) und Git installieren. Prüfen mit `node -v` und `git --version`.
2. Projektordner: Inhalt dieses Startpakets hineinkopieren.
3. Optional schon jetzt: privates GitHub Repository anlegen, am besten unter einem Konto mit Kita Mailadresse.

## Vor Paket 02 (Datenbank)

1. Bei supabase.com mit der Kita Mailadresse anmelden.
2. Neues Projekt: Name `pusteblume-kueche`, Region **Frankfurt (eu-central-1)**, sicheres Datenbankpasswort erzeugen und im Passwortmanager speichern.
3. In den Projekteinstellungen unter API die Projekt URL, den anon bzw. publishable Key und den service_role bzw. secret Key kopieren.
4. `.env.example` nach `.env.local` kopieren und die Werte eintragen. `.env.local` niemals committen.
5. Im Projektordner: `npx supabase login` (öffnet den Browser) und danach `npx supabase link --project-ref <ref>`. Den Ref findest du in der Projekt URL. Das Datenbankpasswort wird abgefragt.

## Vor Paket 03 (Login)

1. Supabase › Authentication › URL Configuration: Site URL `http://localhost:3000`, Redirect URL `http://localhost:3000/auth/callback` hinzufügen.
2. Supabase › Authentication › Providers › Email: aktiv, „Confirm email“ an, neue Anmeldungen (Sign ups) **aus**, damit sich niemand selbst registrieren kann.
3. Ersten Admin anlegen: Supabase › Authentication › Users › Invite user mit deiner eigenen Adresse. Der Link in der Einladungsmail ist nicht nötig, die Anmeldung läuft später über `/login`.
4. Deutsche Mailtexte für Magic Link und Einladung aus `docs/mail-vorlagen.md` unter Authentication › Email Templates einfügen.

### Rollen setzen (erster Admin)

Das Profil entsteht automatisch mit dem Auth Nutzer, hat aber noch keine Rollen. Ohne Rolle zeigt die App „Kein Zugang“. Rolle setzen in Supabase › SQL Editor (Mailadresse anpassen):

```sql
update public.profiles
set roles = '{admin,planung}'
where id = (select id from auth.users where email = 'deine.adresse@example.de');
```

Prüfen mit `select display_name, roles, active from public.profiles;`. Weitere Rollen vergibt später der Admin in der App (Paket 04). Verfügbar sind `admin`, `planung`, `kueche`, `einkauf`.

### Anmelden ohne Mail (Testphase)

Der eingebaute Mailversand von Supabase erlaubt nur etwa 2 Mails pro Stunde. Zum Testen gibt `npm run dev:login` einen Anmeldelink aus, ohne Mail zu verschicken (bei mehreren Nutzern mit Adresse: `npm run dev:login deine@adresse.de`). Link im Browser öffnen, er ist einmalig und etwa eine Stunde gültig. Das Skript braucht den Service Role Key aus `.env.local` und bricht ab, wenn `NEXT_PUBLIC_SITE_URL` nicht auf localhost zeigt. Mit eigenem SMTP (vor Paket 04) ist es nicht mehr nötig.

Wer mehrere Rollen hat, landet nach der Anmeldung auf der Startseite der ersten passenden in dieser Reihenfolge: planung (Speiseplan), kueche (Heute), einkauf (Einkauf), admin (Admin). Nach einer Rollenänderung in der Datenbank genügt Neuladen, ein neuer Login ist nicht nötig.

## Vor Paket 04 (Einladungen an andere)

1. Eigenen Mailversand einrichten (Supabase › Authentication › SMTP Settings), z. B. über das Kita Postfach oder einen Dienst wie Resend. Ohne eigenen SMTP kommen Einladungen und Magic Links an fremde Adressen nicht zuverlässig an, und die App meldet beim Einladen „zu viele Mails“.
2. Die Mailvorlage „Invite user“ in Supabase durch die neue aus `docs/mail-vorlagen.md` ersetzen (Link mit `token_hash`). Mit der alten Vorlage meldet die Einladung nicht an.

## Vor Paket 16 (Livegang)

1. Vercel Konto (Kita Mailadresse), GitHub Repository verbinden.
2. Klären, ob der kostenlose Hobby Plan für den Verein passt (siehe SPEC Abschnitt 11), sonst Pro.
3. Domain festlegen, z. B. `kueche.kita-pusteblume-kempen.info` (DNS beim Anbieter der Kita Website).
4. Auftragsverarbeitungsverträge mit Supabase und Vercel abschließen.

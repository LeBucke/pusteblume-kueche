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
3. Ersten Admin anlegen: Supabase › Authentication › Users › Invite user mit deiner eigenen Adresse. Danach in Paket 03 beschrieben: Rolle admin im Profil setzen.

## Vor Paket 04 (Einladungen an andere)

Eigenen Mailversand einrichten (Supabase › Authentication › SMTP Settings), z. B. über das Kita Postfach oder einen Dienst wie Resend. Ohne eigenen SMTP kommen Einladungen und Magic Links an fremde Adressen nicht zuverlässig an.

## Vor Paket 16 (Livegang)

1. Vercel Konto (Kita Mailadresse), GitHub Repository verbinden.
2. Klären, ob der kostenlose Hobby Plan für den Verein passt (siehe SPEC Abschnitt 11), sonst Pro.
3. Domain festlegen, z. B. `kueche.kita-pusteblume-kempen.info` (DNS beim Anbieter der Kita Website).
4. Auftragsverarbeitungsverträge mit Supabase und Vercel abschließen.

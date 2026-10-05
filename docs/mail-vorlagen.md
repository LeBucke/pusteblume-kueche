# Mailvorlagen für Supabase

Einfügen unter Supabase › Authentication › Email Templates. Die Platzhalter in doppelten geschweiften Klammern (`{{ .ConfirmationURL }}`) nicht ändern. Betreff und Text jeweils ersetzen.

Hinweis zum Magic Link: Der Link funktioniert nur in dem Browser, in dem die Anmeldung angefordert wurde. Der Hinweis steht deshalb auch in der Mail.

## Magic Link („Magic Link“)

**Betreff:** Dein Link zur Pusteblume Küche

```html
<h2>Hallo!</h2>
<p>Mit diesem Link meldest du dich bei der Pusteblume Küche an:</p>
<p><a href="{{ .ConfirmationURL }}">Jetzt anmelden</a></p>
<p>Bitte öffne den Link in demselben Browser (und auf demselben Gerät), auf dem du die Anmeldung angefordert hast.</p>
<p>Der Link ist nur kurz gültig und funktioniert nur einmal. Wenn du dich nicht anmelden wolltest, kannst du diese Mail einfach löschen.</p>
<p>Viele Grüße<br>Kita Pusteblume e.V. Kempen</p>
```

## Einladung („Invite user“)

**Betreff:** Du bist zur Pusteblume Küche eingeladen

Wichtig: Der Link nutzt `token_hash` statt `{{ .ConfirmationURL }}`. Einladungen aus dem Adminbereich laufen ohne den Browser der eingeladenen Person, deshalb schickt Supabase mit `{{ .ConfirmationURL }}` die Anmeldedaten im URL Fragment (`#access_token=…`) zurück, und das kann `/auth/callback` auf dem Server nicht lesen. Mit `token_hash` löst die App den Link selbst ein. Funktioniert nur, wenn **Site URL** in Supabase › Authentication › URL Configuration die Adresse der App ist.

```html
<h2>Willkommen in der Pusteblume Küche!</h2>
<p>Du wurdest zur Küchen App der Kita Pusteblume e.V. Kempen eingeladen.</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite">Einladung annehmen und anmelden</a></p>
<p>Später meldest du dich jedes Mal mit deiner Mailadresse an: Auf der Anmeldeseite bekommst du einen Link zugeschickt, ein Passwort brauchst du nicht.</p>
<p>Viele Grüße<br>Kita Pusteblume e.V. Kempen</p>
```

## Weitere Vorlagen

„Confirm signup“, „Change Email Address“, „Reset Password“ und „Reauthentication“ werden von der App nicht benutzt (keine Registrierung, keine Passwörter). Sie können auf dem Standard bleiben.

// Hilfsmittel für die Testphase: gibt einen Anmeldelink ohne Mailversand aus (umgeht das Mail Limit von Supabase).
// Nutzung: npm run dev:login [mailadresse]   (ohne Adresse, wenn es nur einen Nutzer gibt)
// Läuft nur lokal. Der Link ist einmalig und etwa eine Stunde gültig.
import { createClient } from "@supabase/supabase-js";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const { hostname } = new URL(siteUrl);

if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1"].includes(hostname)) {
  console.error(`Abbruch: NEXT_PUBLIC_SITE_URL ist ${siteUrl}. Das Skript läuft nur gegen localhost.`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let email = process.argv[2];
if (!email) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  if (data.users.length !== 1) {
    console.error(
      `Es gibt ${data.users.length} Nutzer, bitte eine Adresse angeben: npm run dev:login deine@adresse.de`,
    );
    process.exit(1);
  }
  email = data.users[0].email;
}

const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error) {
  console.error(`Kein Link für ${email}: ${error.message}`);
  process.exit(1);
}

console.log(`Anmeldelink für ${email} (einmalig, etwa eine Stunde gültig):\n`);
console.log(`${siteUrl}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink`);

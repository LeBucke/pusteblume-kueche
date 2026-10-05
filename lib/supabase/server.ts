import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { supabasePublicEnv } from "./env";

/** Supabase Client für Server Komponenten, Server Actions und Route Handler (läuft als der angemeldete Nutzer). */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabasePublicEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Aus einer Server Komponente kann man keine Cookies setzen. Das ist in Ordnung,
          // solange proxy.ts die Sitzung erneuert.
        }
      },
    },
  });
}

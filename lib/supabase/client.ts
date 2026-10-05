import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { supabasePublicEnv } from "./env";

/** Supabase Client für Client Komponenten (z. B. Realtime in der Einkaufsliste). */
export function createClient() {
  const { url, anonKey } = supabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}

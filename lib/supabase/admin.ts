import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabasePublicEnv } from "./env";

/**
 * Client mit Service Role Key, umgeht die RLS. Nur serverseitig und nur in Server Actions oder
 * Route Handlern, die vorher die Rolle des Aufrufers geprüft haben. Nie in Client Komponenten importieren.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY fehlt (siehe .env.example).");
  }
  return createClient<Database>(supabasePublicEnv().url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

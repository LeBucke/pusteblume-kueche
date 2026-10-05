import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { supabasePublicEnv } from "./env";

/**
 * Erneuert die Sitzung (Cookies) und sagt, ob jemand angemeldet ist.
 * Wer eine eigene Antwort schickt (z. B. Weiterleitung), muss die Cookies mit `copyCookies` übernehmen.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = supabasePublicEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Prüft das Token (und erneuert es, falls es bald abläuft).
  const { data } = await supabase.auth.getClaims();

  return { response: () => response, signedIn: Boolean(data?.claims) };
}

/** Überträgt die erneuerten Sitzungs Cookies auf eine andere Antwort, z. B. eine Weiterleitung. */
export function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  from.headers.forEach((value, key) => {
    if (key === "cache-control" || key === "expires" || key === "pragma") {
      to.headers.set(key, value);
    }
  });
  return to;
}

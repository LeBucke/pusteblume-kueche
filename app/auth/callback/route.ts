import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { homePath, normalizeRoles } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

/** Ziel des Links aus der Mail: Code (Magic Link) oder token_hash (Einladung) gegen eine Sitzung tauschen. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  if (!ok) return NextResponse.redirect(`${origin}/login?fehler=link`);

  // Startseite nach Rolle. Ohne aktives Profil oder ohne Rolle: Seite „Kein Zugang“.
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("roles, active").eq("id", userId).maybeSingle()
    : { data: null };
  const target = profile?.active ? homePath(normalizeRoles(profile.roles)) : null;

  return NextResponse.redirect(`${origin}${target ?? "/kein-zugang"}`);
}

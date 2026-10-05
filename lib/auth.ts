import { cache } from "react";
import { redirect } from "next/navigation";
import { canAccess, homePath, normalizeRoles } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export interface CurrentProfile {
  id: string;
  displayName: string;
  roles: AppRole[];
}

/**
 * Das Profil des angemeldeten Nutzers. null, wenn niemand angemeldet ist, das Profil fehlt,
 * der Nutzer deaktiviert ist (die RLS zeigt ihm dann auch sein Profil nicht mehr) oder keine Rolle hat.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, roles, active")
    .eq("id", userId)
    .maybeSingle();

  if (!data || !data.active) return null;
  const roles = normalizeRoles(data.roles);
  if (roles.length === 0) return null;
  return { id: data.id, displayName: data.display_name, roles };
});

/** Für Teamseiten: ohne Sitzung auf /login, ohne aktives Profil mit Rolle auf /kein-zugang. */
export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (profile) return profile;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  redirect(claims?.claims.sub ? "/kein-zugang" : "/login");
}

/**
 * Für Server Actions im Adminbereich: das Layout schützt die Seite, aber eine Action lässt sich auch
 * direkt aufrufen. Wer kein aktiver Admin ist, kommt nicht weiter.
 */
export async function requireAdmin(): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (!profile.roles.includes("admin")) {
    redirect(homePath(profile.roles) ?? "/kein-zugang");
  }
  return profile;
}

/**
 * Für Server Actions, die Rezepte und Stammdaten der Planung ändern (Zutaten, später Rezepte und Plan):
 * nur planung und admin. Wie bei requireAdmin schützt das Layout die Seite, die Action prüft selbst.
 */
export async function requirePlanung(): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (!profile.roles.includes("planung") && !profile.roles.includes("admin")) {
    redirect(homePath(profile.roles) ?? "/kein-zugang");
  }
  return profile;
}

/** Wie requireProfile, und schickt auf die eigene Startseite, wenn die Rollen die Route nicht erlauben. */
export async function requireAccess(pathname: string): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (!canAccess(profile.roles, pathname)) {
    redirect(homePath(profile.roles) ?? "/kein-zugang");
  }
  return profile;
}

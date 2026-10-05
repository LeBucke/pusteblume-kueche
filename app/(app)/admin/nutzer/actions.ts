"use server";

import { revalidatePath } from "next/cache";
import {
  activeSchema,
  firstError,
  inviteSchema,
  leavesNoActiveAdmin,
  rolesSchema,
  type ActionState,
} from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { normalizeRoles } from "@/lib/roles";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

const LAST_ADMIN_MESSAGE =
  "Es muss mindestens ein aktiver Admin übrig bleiben. Ernenne zuerst jemand anderen zum Admin.";

const GENERIC_ERROR = "Das hat leider nicht geklappt. Bitte versuche es noch einmal.";

function inviteErrorMessage(error: { status?: number; code?: string }): string {
  if (error.code === "email_exists" || error.code === "user_already_exists") {
    return "Zu dieser Adresse gibt es schon ein Konto.";
  }
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return "Es wurden gerade zu viele Mails verschickt. Bitte warte ein paar Minuten und versuche es noch einmal.";
  }
  if (error.code === "email_address_not_authorized") {
    return "Der Mailversand ist noch nicht eingerichtet: Ohne eigenen SMTP Zugang verschickt Supabase Mails nur an Mitglieder des Supabase Teams.";
  }
  return GENERIC_ERROR;
}

/**
 * Lädt per Mail ein und setzt Name und Rollen danach selbst auf dem Profil. Der Trigger liest die Rollen
 * zwar aus der Einladung, aber nur, wenn `invited_at` schon beim Insert gesetzt ist (siehe DECISIONS, Paket 02).
 */
async function inviteWithProfile(input: {
  displayName: string;
  email: string;
  roles: AppRole[];
}): Promise<{ error: string } | { userId: string }> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${siteUrl()}/auth/callback`,
    data: { display_name: input.displayName, roles: input.roles },
  });
  if (error || !data.user) return { error: error ? inviteErrorMessage(error) : GENERIC_ERROR };

  const userId = data.user.id;
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: userId, display_name: input.displayName, roles: input.roles, active: true });
  const { data: check } = await admin.from("profiles").select("roles").eq("id", userId).single();
  const saved = normalizeRoles(check?.roles);
  if (profileError || saved.join() !== input.roles.join()) {
    return {
      error:
        "Die Einladung ging raus, aber die Rollen konnten nicht gespeichert werden. Bitte prüfe sie in der Liste.",
    };
  }
  return { userId };
}

/**
 * Legt eine offene Einladung ohne Mail wieder an, nachdem `reinviteUser` sie gelöscht hat und der Versand
 * scheiterte. Gibt es die Adresse schon (Einladung kam doch an, nur die Rollen scheiterten), bleibt sie.
 */
async function restorePendingUser(input: { displayName: string; email: string; roles: AppRole[] }) {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.createUser({
    email: input.email,
    email_confirm: false,
    app_metadata: { roles: input.roles },
    user_metadata: { display_name: input.displayName },
  });
  if (data.user) {
    await admin
      .from("profiles")
      .upsert({ id: data.user.id, display_name: input.displayName, roles: input.roles, active: true });
  }
}

export async function inviteUser(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = inviteSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const result = await inviteWithProfile(parsed.data);
  if ("error" in result) {
    revalidatePath("/admin/nutzer");
    return { status: "error", message: result.error };
  }

  revalidatePath("/admin/nutzer");
  return { status: "ok", message: `Einladung an ${parsed.data.email} verschickt.` };
}

async function loadProfiles() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, roles, active");
  return (data ?? []).map((row) => ({ ...row, roles: normalizeRoles(row.roles) }));
}

export async function setUserRoles(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = rolesSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };
  const { userId, roles } = parsed.data;

  if (leavesNoActiveAdmin(await loadProfiles(), userId, { roles })) {
    return { status: "error", message: LAST_ADMIN_MESSAGE };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").update({ roles }).eq("id", userId).select("id");
  if (error || !data?.length) return { status: "error", message: GENERIC_ERROR };

  revalidatePath("/admin/nutzer");
  return { status: "ok", message: "Rollen gespeichert." };
}

export async function setUserActive(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = activeSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    active: formData.get("active") === "true",
  });
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };
  const { userId, active } = parsed.data;

  if (leavesNoActiveAdmin(await loadProfiles(), userId, { active })) {
    return { status: "error", message: LAST_ADMIN_MESSAGE };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").update({ active }).eq("id", userId).select("id");
  if (error || !data?.length) return { status: "error", message: GENERIC_ERROR };

  revalidatePath("/admin/nutzer");
  return { status: "ok", message: active ? "Wieder aktiv." : "Deaktiviert." };
}

/**
 * Nur für Personen, die die Einladung noch nicht angenommen haben: Der offene Auth Nutzer wird gelöscht
 * und mit denselben Angaben neu eingeladen (`inviteUserByEmail` scheitert bei einer vorhandenen Adresse).
 */
export async function reinviteUser(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (!rolesSchema.shape.userId.safeParse(userId).success) {
    return { status: "error", message: "Unbekannte Person." };
  }

  const admin = createAdminClient();
  const { data: found } = await admin.auth.admin.getUserById(userId);
  const user = found?.user;
  if (!user?.email) return { status: "error", message: "Unbekannte Person." };
  if (user.email_confirmed_at || user.last_sign_in_at) {
    return {
      status: "error",
      message: "Diese Person hat sich schon angemeldet. Sie meldet sich mit ihrer Mailadresse auf der Anmeldeseite an.",
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, roles")
    .eq("id", userId)
    .single();
  const roles = normalizeRoles(profile?.roles);
  if (!profile || roles.length === 0) return { status: "error", message: GENERIC_ERROR };

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return { status: "error", message: GENERIC_ERROR };

  const input = { displayName: profile.display_name, email: user.email, roles };
  const result = await inviteWithProfile(input);
  if ("error" in result) {
    // Der Versand hat nicht geklappt (z. B. Mail Limit): die Person soll nicht verloren gehen.
    await restorePendingUser(input);
    revalidatePath("/admin/nutzer");
    return { status: "error", message: result.error };
  }

  revalidatePath("/admin/nutzer");
  return { status: "ok", message: `Neue Einladung an ${user.email} verschickt.` };
}

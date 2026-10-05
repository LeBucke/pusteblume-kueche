"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string };

const emailSchema = z
  .string()
  .trim()
  .pipe(z.email({ error: "Bitte gib eine gültige Mailadresse ein." }));

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Schickt den Magic Link. Es werden keine neuen Konten angelegt (shouldCreateUser: false). */
export async function requestMagicLink(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  if (error) {
    if (error.status === 429) {
      return {
        status: "error",
        message: "Zu viele Versuche. Bitte warte ein paar Minuten und versuche es dann noch einmal.",
      };
    }
    // Unbekannte Adresse: gleiche Antwort wie bei einer bekannten, damit niemand Adressen durchprobieren kann.
    if (error.status === 400 || error.status === 422) {
      return { status: "sent" };
    }
    return {
      status: "error",
      message:
        "Das hat leider nicht geklappt. Bitte versuche es später noch einmal oder wende dich an den Vorstand.",
    };
  }

  return { status: "sent" };
}

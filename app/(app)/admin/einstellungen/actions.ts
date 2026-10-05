"use server";

import { revalidatePath } from "next/cache";
import { firstError, settingsSchema, type ActionState } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveSettings(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    defaultChildren: formData.get("defaultChildren") ?? "",
    defaultAdults: formData.get("defaultAdults") ?? "",
    adultFactor: formData.get("adultFactor") ?? "",
  });
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .update({
      default_children: parsed.data.defaultChildren,
      default_adults: parsed.data.defaultAdults,
      adult_factor: parsed.data.adultFactor,
    })
    .eq("id", 1)
    .select("id");
  if (error || !data?.length) {
    return { status: "error", message: "Das hat leider nicht geklappt. Bitte versuche es noch einmal." };
  }

  revalidatePath("/admin/einstellungen");
  return { status: "ok", message: "Einstellungen gespeichert." };
}

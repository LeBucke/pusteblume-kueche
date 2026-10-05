"use server";

import { revalidatePath } from "next/cache";
import { firstError, type ActionState } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { parseQuickAllergenForm } from "@/lib/ingredients";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Das hat leider nicht geklappt. Bitte versuche es noch einmal.";

/** Schnellbearbeitung der Allergene einer Zutat auf der Prüfseite. */
export async function saveQuickAllergens(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseQuickAllergenForm(formData);
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .update({ allergens: parsed.data.allergens, allergens_checked: parsed.data.allergensChecked })
    .eq("id", parsed.data.id)
    .select("id");
  if (error || !data?.length) return { status: "error", message: GENERIC_ERROR };

  revalidatePath("/admin/allergene");
  revalidatePath("/zutaten", "layout");
  return {
    status: "ok",
    message: parsed.data.allergensChecked ? "Als geprüft gespeichert." : "Gespeichert, die Zutat bleibt ungeprüft.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { firstError, type ActionState } from "@/lib/admin";
import { requirePlanung } from "@/lib/auth";
import {
  conflictMessage,
  findConflicts,
  ingredientIdSchema,
  ingredientSchema,
  mergeSchema,
  parseIngredientForm,
  type SearchableIngredient,
} from "@/lib/ingredients";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Das hat leider nicht geklappt. Bitte versuche es noch einmal.";
const DUPLICATE_ERROR = "Eine Zutat mit diesem Namen gibt es schon.";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Name und Synonyme aller Zutaten, auch archivierter: Der Name ist in der Datenbank eindeutig. */
async function loadSearchable(supabase: Supabase): Promise<SearchableIngredient[] | null> {
  const { data, error } = await supabase.from("ingredients").select("id, name, aliases");
  return error ? null : data;
}

function revalidateIngredients() {
  revalidatePath("/zutaten", "layout");
  revalidatePath("/admin/allergene");
}

export async function createIngredient(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlanung();

  const parsed = parseIngredientForm(formData);
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const others = await loadSearchable(supabase);
  if (!others) return { status: "error", message: GENERIC_ERROR };
  const [conflict] = findConflicts(parsed.data, others);
  if (conflict) return { status: "error", message: conflictMessage(conflict) };

  const { name, aliases, productGroupId, defaultUnit, supplierId, allergens, allergensChecked, notes } =
    parsed.data;
  const { error } = await supabase.from("ingredients").insert({
    name,
    aliases,
    product_group_id: productGroupId,
    default_unit: defaultUnit,
    supplier_id: supplierId,
    allergens,
    allergens_checked: allergensChecked,
    notes,
  });
  if (error) {
    return { status: "error", message: error.code === "23505" ? DUPLICATE_ERROR : GENERIC_ERROR };
  }

  revalidateIngredients();
  return { status: "ok", message: `${name} angelegt.` };
}

export async function updateIngredient(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlanung();

  const id = ingredientIdSchema.safeParse(String(formData.get("id") ?? ""));
  const parsed = parseIngredientForm(formData);
  if (!id.success) return { status: "error", message: firstError(id.error) };
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const others = await loadSearchable(supabase);
  if (!others) return { status: "error", message: GENERIC_ERROR };
  const [conflict] = findConflicts({ id: id.data, ...parsed.data }, others);
  if (conflict) return { status: "error", message: conflictMessage(conflict) };

  const { name, aliases, productGroupId, defaultUnit, supplierId, allergens, allergensChecked, notes } =
    parsed.data;
  const { data, error } = await supabase
    .from("ingredients")
    .update({
      name,
      aliases,
      product_group_id: productGroupId,
      default_unit: defaultUnit,
      supplier_id: supplierId,
      allergens,
      allergens_checked: allergensChecked,
      notes,
    })
    .eq("id", id.data)
    .select("id");
  if (error || !data?.length) {
    return { status: "error", message: error?.code === "23505" ? DUPLICATE_ERROR : GENERIC_ERROR };
  }

  revalidateIngredients();
  return { status: "ok", message: "Gespeichert." };
}

export async function setIngredientArchived(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlanung();

  const id = ingredientIdSchema.safeParse(String(formData.get("id") ?? ""));
  if (!id.success) return { status: "error", message: firstError(id.error) };
  const archived = formData.get("archived") === "true";

  const supabase = await createClient();
  const { data, error } = await supabase.from("ingredients").update({ archived }).eq("id", id.data).select("id");
  if (error || !data?.length) return { status: "error", message: GENERIC_ERROR };

  revalidateIngredients();
  return { status: "ok", message: archived ? "Archiviert." : "Wieder aktiv." };
}

export async function mergeIngredients(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlanung();

  const parsed = mergeSchema.safeParse({
    sourceId: String(formData.get("sourceId") ?? ""),
    targetId: String(formData.get("targetId") ?? ""),
  });
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("merge_ingredients", {
    source_id: parsed.data.sourceId,
    target_id: parsed.data.targetId,
  });
  if (error || typeof data !== "number") {
    return {
      status: "error",
      message: error?.code === "P0002" ? "Eine der beiden Zutaten gibt es nicht mehr." : GENERIC_ERROR,
    };
  }

  revalidateIngredients();
  revalidatePath("/rezepte", "layout");
  // Die Quelle ist jetzt archiviert, die Vorschau gäbe es nicht mehr. Die Seite zeigt deshalb das Ergebnis.
  redirect(`/zutaten/zusammenfuehren?fertig=${data}&ziel=${parsed.data.targetId}`);
}

export type InlineIngredientResult =
  | { status: "ok"; ingredient: { id: string; name: string; aliases: string[] } }
  | { status: "error"; message: string; existing?: { id: string; name: string; aliases: string[] } };

/**
 * Für den IngredientPicker: legt eine Zutat nur mit Namen an. Sie startet mit ungeprüften Allergenen
 * und erscheint damit auf der Prüfseite. Gibt es den Namen schon, kommt die vorhandene Zutat zurück,
 * damit der Picker sie anbieten kann.
 */
export async function createIngredientInline(name: string): Promise<InlineIngredientResult> {
  await requirePlanung();

  const parsed = ingredientSchema.safeParse({
    name,
    aliases: "",
    productGroupId: "",
    defaultUnit: "",
    supplierId: "",
    allergens: [],
    allergensChecked: false,
    notes: "",
  });
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const others = await loadSearchable(supabase);
  if (!others) return { status: "error", message: GENERIC_ERROR };
  const [conflict] = findConflicts(parsed.data, others);
  if (conflict) {
    const existing = others.find((other) => other.id === conflict.ingredientId);
    return {
      status: "error",
      message: conflictMessage(conflict),
      existing: existing && { id: existing.id, name: existing.name, aliases: [...existing.aliases] },
    };
  }

  const { data, error } = await supabase
    .from("ingredients")
    .insert({ name: parsed.data.name, aliases: [], allergens: [], allergens_checked: false })
    .select("id, name, aliases")
    .single();
  if (error || !data) {
    return { status: "error", message: error?.code === "23505" ? DUPLICATE_ERROR : GENERIC_ERROR };
  }

  revalidateIngredients();
  return { status: "ok", ingredient: data };
}

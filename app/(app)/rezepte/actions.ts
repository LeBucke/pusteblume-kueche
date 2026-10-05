"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { firstError, type ActionState } from "@/lib/admin";
import { requirePlanung } from "@/lib/auth";
import { newlyArchivedIngredients, parseRecipeLines, recipeIdSchema, recipeSchema } from "@/lib/recipes";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Das hat leider nicht geklappt. Bitte versuche es noch einmal.";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function revalidateRecipes() {
  revalidatePath("/rezepte", "layout");
}

/** Legt ein Rezept an (ohne `id`) oder ändert es. Rezept und Zutatenzeilen werden in einer Transaktion gespeichert. */
export async function saveRecipe(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlanung();

  const rawId = text(formData, "id");
  const id = rawId === "" ? null : recipeIdSchema.safeParse(rawId);
  if (id && !id.success) return { status: "error", message: firstError(id.error) };

  const recipe = recipeSchema.safeParse({
    name: text(formData, "name"),
    course: text(formData, "course"),
    category: text(formData, "category"),
    baseChildren: text(formData, "baseChildren"),
    baseAdults: text(formData, "baseAdults"),
    description: text(formData, "description"),
    author: text(formData, "author"),
    steps: text(formData, "steps"),
    notes: text(formData, "notes"),
  });
  if (!recipe.success) return { status: "error", message: firstError(recipe.error) };

  let rawLines: unknown;
  try {
    rawLines = JSON.parse(text(formData, "lines") || "[]");
  } catch {
    return { status: "error", message: "Die Zutatenliste ist ungültig." };
  }
  const parsedLines = parseRecipeLines(rawLines);
  if (!parsedLines.success) return { status: "error", message: parsedLines.message };
  const lines = parsedLines.lines;

  const supabase = await createClient();

  // Zutaten müssen es geben, und archivierte kommen nicht neu in ein Rezept (nur wenn sie schon darin standen).
  const ingredientIds = [...new Set(lines.map((line) => line.ingredientId))];
  if (ingredientIds.length > 0) {
    const { data: found, error } = await supabase.from("ingredients").select("id, archived").in("id", ingredientIds);
    if (error) return { status: "error", message: GENERIC_ERROR };
    if ((found ?? []).length !== ingredientIds.length) {
      return { status: "error", message: "Eine der Zutaten gibt es nicht mehr. Bitte lade die Seite neu." };
    }
    const archived = new Set((found ?? []).filter((row) => row.archived).map((row) => row.id));
    let previous = new Set<string>();
    if (id?.success && archived.size > 0) {
      const { data: existing } = await supabase
        .from("recipe_ingredients")
        .select("ingredient_id")
        .eq("recipe_id", id.data);
      previous = new Set((existing ?? []).map((row) => row.ingredient_id));
    }
    if (newlyArchivedIngredients(lines, archived, previous).length > 0) {
      return {
        status: "error",
        message: "Eine der Zutaten ist archiviert. Wähle die vorhandene aktive Zutat oder aktiviere sie wieder.",
      };
    }
  }

  const { name, course, category, baseChildren, baseAdults, description, author, steps, notes } = recipe.data;
  const { data: savedId, error } = await supabase.rpc("save_recipe", {
    // Die Funktion nimmt null für „neu“, die generierten Typen kennen das nicht.
    p_id: (id?.success ? id.data : null) as string,
    p_recipe: {
      name,
      course,
      category,
      base_children: baseChildren,
      base_adults: baseAdults,
      description,
      author,
      steps,
      notes,
    },
    p_lines: lines.map((line) => ({
      ingredient_id: line.ingredientId,
      amount: line.amount,
      unit: line.unit,
      note: line.note,
    })),
  });
  if (error || typeof savedId !== "string") {
    return {
      status: "error",
      message: error?.code === "P0002" ? "Dieses Rezept gibt es nicht mehr." : GENERIC_ERROR,
    };
  }

  revalidateRecipes();
  redirect(`/rezepte/${savedId}`);
}

export async function setRecipeArchived(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlanung();

  const id = recipeIdSchema.safeParse(text(formData, "id"));
  if (!id.success) return { status: "error", message: firstError(id.error) };
  const archived = formData.get("archived") === "true";

  const supabase = await createClient();
  const { data, error } = await supabase.from("recipes").update({ archived }).eq("id", id.data).select("id");
  if (error || !data?.length) return { status: "error", message: GENERIC_ERROR };

  revalidateRecipes();
  return { status: "ok", message: archived ? "Archiviert." : "Wieder aktiv." };
}

import type { RecipeFormIngredient, RecipeFormLine } from "@/components/recipes/recipe-form";
import { formatNumber } from "@/lib/quantities";
import { categoryOptions } from "@/lib/recipes";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Zutaten (nur aktive) und Kategorien für den Editor. */
export async function loadEditorOptions(supabase: Supabase): Promise<{
  ingredients: RecipeFormIngredient[];
  categories: string[];
  defaults: { children: number; adults: number };
}> {
  const [{ data: ingredients }, { data: categories }, { data: settings }] = await Promise.all([
    supabase.from("ingredients").select("id, name, aliases, default_unit").eq("archived", false).order("name"),
    supabase.from("recipes").select("category"),
    supabase.from("settings").select("default_children, default_adults").maybeSingle(),
  ]);
  return {
    ingredients: (ingredients ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      aliases: i.aliases,
      defaultUnit: i.default_unit,
    })),
    categories: categoryOptions((categories ?? []).map((row) => row.category)),
    defaults: { children: settings?.default_children ?? 20, adults: settings?.default_adults ?? 5 },
  };
}

type LineRow = {
  amount: number | null;
  unit: string | null;
  note: string | null;
  ingredients: { id: string; name: string; aliases: string[] } | null;
};

/** Zutatenzeilen eines gespeicherten Rezepts als Formularzeilen (Menge als Text mit Komma). */
export function toFormLines(rows: readonly LineRow[]): RecipeFormLine[] {
  return rows.map((row) => ({
    ingredient: row.ingredients && {
      id: row.ingredients.id,
      name: row.ingredients.name,
      aliases: row.ingredients.aliases,
    },
    amount: row.amount === null ? "" : formatNumber(Number(row.amount), 3),
    unit: row.unit ?? "",
    note: row.note ?? "",
  }));
}

/** Einkaufssumme und Textausgabe nach SPEC 4.8 und 6. */

import { formatShort } from "./dates";
import { formatAmount, scaleFactor } from "./quantities";
import { COURSES, type Ingredient, type PlanDay, type Recipe, type ShoppingSettings } from "./types";
import { toBase } from "./units";

export const NO_SUPPLIER = "Ohne Lieferant";
export const NO_GROUP = "Ohne Warengruppe";

interface Placement {
  supplierId: string | null;
  supplierName: string;
  productGroupId: string | null;
  productGroupName: string;
}

export interface ShoppingItem extends Placement {
  /** `<ingredient_id>:<basiseinheit>` */
  key: string;
  ingredientId: string;
  name: string;
  /** Basiseinheit (g, ml oder die Einheit selbst, bei leerer Einheit ""). */
  unit: string;
  /** Summe in der Basiseinheit. */
  amount: number;
  recipeNames: string[];
  /** true, wenn dieselbe Zutat in mehreren Einheitenfamilien vorkommt. */
  mixedUnits: boolean;
}

/** Zutat ohne Menge (Salz, Gewürze) für „Vorrat prüfen“. */
export interface PantryItem extends Placement {
  ingredientId: string;
  name: string;
  recipeNames: string[];
}

export interface ShoppingResult {
  /** Sortiert nach Lieferant, Warengruppe, Name. */
  items: ShoppingItem[];
  pantry: PantryItem[];
}

/**
 * Summiert die Zutaten aller geplanten Gerichte. Geschlossene Tage zählen nicht.
 * Tage ohne eigene Zahlen nutzen die Standardwerte aus `settings`.
 * Eine Zutat ohne Menge kommt nur dann in „Vorrat prüfen“, wenn sie nirgends eine Menge hat.
 */
export function aggregateShopping(
  planDays: readonly PlanDay[],
  recipes: readonly Recipe[],
  ingredients: readonly Ingredient[],
  settings: ShoppingSettings,
): ShoppingResult {
  const recipesById = new Map(recipes.map((r) => [r.id, r]));
  const ingredientsById = new Map(ingredients.map((i) => [i.id, i]));
  const groupsById = new Map(settings.productGroups.map((g) => [g.id, g]));
  const suppliersById = new Map(settings.suppliers.map((s) => [s.id, s]));

  const placementOf = (ingredient: Ingredient): Placement => {
    const group = ingredient.productGroupId ? groupsById.get(ingredient.productGroupId) : undefined;
    const supplierId = ingredient.supplierId ?? group?.defaultSupplierId ?? null;
    const supplier = supplierId ? suppliersById.get(supplierId) : undefined;
    return {
      supplierId: supplier ? supplier.id : null,
      supplierName: supplier?.name ?? NO_SUPPLIER,
      productGroupId: group?.id ?? null,
      productGroupName: group?.name ?? NO_GROUP,
    };
  };

  const sums = new Map<string, { ingredient: Ingredient; unit: string; amount: number; recipes: Set<string> }>();
  const unquantified = new Map<string, { ingredient: Ingredient; recipes: Set<string> }>();

  for (const day of planDays) {
    if (day.closed) continue;
    const target = {
      children: day.children ?? settings.defaultChildren,
      adults: day.adults ?? settings.defaultAdults,
    };

    for (const course of COURSES) {
      const recipeId = day.meals[course];
      const recipe = recipeId ? recipesById.get(recipeId) : undefined;
      if (!recipe) continue;
      const factor = scaleFactor(
        { children: recipe.baseChildren, adults: recipe.baseAdults },
        target,
        settings.adultFactor,
      );

      for (const line of recipe.ingredients) {
        const ingredient = ingredientsById.get(line.ingredientId);
        if (!ingredient) continue;

        if (line.amount == null) {
          const entry = unquantified.get(ingredient.id) ?? { ingredient, recipes: new Set<string>() };
          entry.recipes.add(recipe.name);
          unquantified.set(ingredient.id, entry);
          continue;
        }

        const base = toBase(line.amount * factor, line.unit);
        if (!(base.amount > 0)) continue;
        const key = `${ingredient.id}:${base.unit}`;
        const entry = sums.get(key) ?? { ingredient, unit: base.unit, amount: 0, recipes: new Set<string>() };
        entry.amount += base.amount;
        entry.recipes.add(recipe.name);
        sums.set(key, entry);
      }
    }
  }

  const unitsPerIngredient = new Map<string, number>();
  for (const { ingredient } of sums.values()) {
    unitsPerIngredient.set(ingredient.id, (unitsPerIngredient.get(ingredient.id) ?? 0) + 1);
  }

  const supplierSort = (id: string | null) => (id ? (suppliersById.get(id)?.sort ?? Infinity) : Infinity);
  const groupSort = (id: string | null) => (id ? (groupsById.get(id)?.sort ?? Infinity) : Infinity);
  const compare = (a: Placement & { name: string }, b: Placement & { name: string }) =>
    supplierSort(a.supplierId) - supplierSort(b.supplierId) ||
    a.supplierName.localeCompare(b.supplierName, "de") ||
    groupSort(a.productGroupId) - groupSort(b.productGroupId) ||
    a.productGroupName.localeCompare(b.productGroupName, "de") ||
    a.name.localeCompare(b.name, "de");

  const items: ShoppingItem[] = [...sums.entries()].map(([key, entry]) => ({
    key,
    ingredientId: entry.ingredient.id,
    name: entry.ingredient.name,
    unit: entry.unit,
    amount: entry.amount,
    recipeNames: [...entry.recipes].sort((a, b) => a.localeCompare(b, "de")),
    mixedUnits: (unitsPerIngredient.get(entry.ingredient.id) ?? 0) > 1,
    ...placementOf(entry.ingredient),
  }));
  items.sort((a, b) => compare(a, b) || a.unit.localeCompare(b.unit, "de"));

  const pantry: PantryItem[] = [...unquantified.values()]
    .filter(({ ingredient }) => !unitsPerIngredient.has(ingredient.id))
    .map(({ ingredient, recipes: names }) => ({
      ingredientId: ingredient.id,
      name: ingredient.name,
      recipeNames: [...names].sort((a, b) => a.localeCompare(b, "de")),
      ...placementOf(ingredient),
    }));
  pantry.sort(compare);

  return { items, pantry };
}

/**
 * Einkaufstext für einen Lieferanten, nur offene Positionen, schlichtes Format:
 *
 * ```
 * Einkauf Biobauer für 12.10. bis 16.10.
 *
 * Gemüse
 * Kartoffeln: 8,5 kg
 * ```
 *
 * `range` schließt beide Tage ein. Die Reihenfolge von `items` bleibt erhalten.
 */
export function toShareText(
  supplier: { id: string | null; name: string },
  items: readonly ShoppingItem[],
  range: { from: string; to: string },
  checked: ReadonlySet<string>,
): string {
  const lines = [`Einkauf ${supplier.name} für ${formatShort(range.from)} bis ${formatShort(range.to)}`];

  const groups = new Map<string, string[]>();
  for (const item of items) {
    if (item.supplierId !== supplier.id || checked.has(item.key)) continue;
    const list = groups.get(item.productGroupName) ?? [];
    list.push(`${item.name}: ${formatAmount(item.amount, item.unit, "shopping")}`);
    groups.set(item.productGroupName, list);
  }

  for (const [group, entries] of groups) {
    lines.push("", group, ...entries);
  }
  return lines.join("\n");
}

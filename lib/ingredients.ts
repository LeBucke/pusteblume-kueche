/** Zutaten: Suche, Dublettenprüfung und Eingabeprüfung (SPEC 4.2). Reine Funktionen, ohne Datenbank. */

import { z } from "zod";
import { optionalText, requiredName } from "./admin";
import { ALLERGENS, type AllergenKey } from "./allergens";
import { UNITS } from "./units";

export interface SearchableIngredient {
  id: string;
  name: string;
  aliases: readonly string[];
}

/** Vergleichsform: klein, ohne Akzente, ß als ss, Leerraum zusammengefasst. „Möhre“ und „mohre“ sind gleich. */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Synonyme aus einem Textfeld: getrennt durch Komma, Semikolon oder Zeilenumbruch, ohne Leere und Doppelte. */
export function parseAliases(text: string, ownName = ""): string[] {
  const own = foldText(ownName);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of text.split(/[,;\n]/)) {
    const alias = part.replace(/\s+/g, " ").trim();
    const key = foldText(alias);
    if (!key || key === own || seen.has(key)) continue;
    seen.add(key);
    result.push(alias);
  }
  return result;
}

/**
 * Treffer für eine Sucheingabe. Jedes Wort der Eingabe muss in Name oder Synonymen vorkommen
 * (Teiltreffer). Reihenfolge: Name beginnt mit der Eingabe, Name enthält sie, nur über Synonym, dann nach Name.
 * Leere Eingabe ergibt alle Zutaten nach Name.
 */
export function searchIngredients<T extends SearchableIngredient>(ingredients: readonly T[], query: string): T[] {
  const needle = foldText(query);
  const words = needle === "" ? [] : needle.split(" ");

  const scored: Array<{ ingredient: T; rank: number }> = [];
  for (const ingredient of ingredients) {
    const name = foldText(ingredient.name);
    const aliases = ingredient.aliases.map(foldText);
    const haystack = [name, ...aliases];

    if (!words.every((word) => haystack.some((text) => text.includes(word)))) continue;

    let rank = 3;
    if (words.length === 0) rank = 0;
    else if (name.startsWith(needle)) rank = 0;
    else if (name.includes(needle)) rank = 1;
    else if (words.every((word) => name.includes(word))) rank = 2;
    scored.push({ ingredient, rank });
  }

  return scored
    .sort((a, b) => a.rank - b.rank || a.ingredient.name.localeCompare(b.ingredient.name, "de"))
    .map((entry) => entry.ingredient);
}

export interface IngredientConflict {
  ingredientId: string;
  ingredientName: string;
  /** Der Wert des neuen oder geänderten Eintrags, der kollidiert. */
  value: string;
  /** Womit er kollidiert: dem Namen oder einem Synonym der anderen Zutat. */
  with: "name" | "alias";
}

/**
 * Name oder Synonyme, die schon bei einer anderen Zutat vorkommen (Name oder Synonym, ohne Groß und
 * Kleinschreibung und ohne Akzente). Die Zutat selbst (`candidate.id`) zählt nicht.
 */
export function findConflicts(
  candidate: { id?: string; name: string; aliases: readonly string[] },
  others: readonly SearchableIngredient[],
): IngredientConflict[] {
  const values = [candidate.name, ...candidate.aliases].filter((value) => foldText(value) !== "");
  const conflicts: IngredientConflict[] = [];

  for (const other of others) {
    if (other.id === candidate.id) continue;
    const otherName = foldText(other.name);
    const otherAliases = other.aliases.map(foldText);
    for (const value of values) {
      const folded = foldText(value);
      if (folded === otherName) {
        conflicts.push({ ingredientId: other.id, ingredientName: other.name, value, with: "name" });
      } else if (otherAliases.includes(folded)) {
        conflicts.push({ ingredientId: other.id, ingredientName: other.name, value, with: "alias" });
      }
    }
  }
  return conflicts;
}

/** Hinweistext für den ersten Konflikt, auf Deutsch und mit dem Namen der vorhandenen Zutat. */
export function conflictMessage(conflict: IngredientConflict): string {
  const what =
    conflict.with === "name"
      ? `„${conflict.value}“ gibt es schon als Zutat.`
      : `„${conflict.value}“ ist schon ein Synonym der Zutat „${conflict.ingredientName}“.`;
  return `${what} Nimm die vorhandene Zutat oder führe beide zusammen.`;
}

// ---------------------------------------------------------------------------
// Eingabeprüfung
// ---------------------------------------------------------------------------

const optionalUuid = (message: string) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.uuid({ error: message }).nullable());

const allergenKeys = z
  .array(z.enum(ALLERGENS.map((a) => a.key) as [AllergenKey, ...AllergenKey[]], { error: "Unbekanntes Allergen." }))
  .transform((values) => ALLERGENS.map((a) => a.key).filter((key) => values.includes(key)));

const defaultUnit = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.enum(UNITS, { error: "Unbekannte Einheit." }).nullable());

export const ingredientIdSchema = z.uuid({ error: "Unbekannte Zutat." });

export const quickAllergenSchema = z.object({
  id: ingredientIdSchema,
  allergens: allergenKeys,
  allergensChecked: z.boolean(),
});

export const ingredientSchema = z
  .object({
    name: requiredName("einen Namen"),
    aliases: z.string().max(500, { error: "Die Synonyme sind zu lang (höchstens 500 Zeichen)." }),
    productGroupId: optionalUuid("Unbekannte Warengruppe."),
    defaultUnit,
    supplierId: optionalUuid("Unbekannter Lieferant."),
    allergens: allergenKeys,
    allergensChecked: z.boolean(),
    notes: optionalText(1000),
  })
  .transform((input) => ({ ...input, aliases: parseAliases(input.aliases, input.name) }));

export type IngredientInput = z.infer<typeof ingredientSchema>;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

/** Liest das Zutatenformular (Anlegen und Bearbeiten) aus den Formulardaten. */
export function parseIngredientForm(formData: FormData) {
  return ingredientSchema.safeParse({
    name: text(formData, "name"),
    aliases: text(formData, "aliases"),
    productGroupId: text(formData, "productGroupId"),
    defaultUnit: text(formData, "defaultUnit"),
    supplierId: text(formData, "supplierId"),
    allergens: formData.getAll("allergens").map(String),
    allergensChecked: formData.get("allergensChecked") === "on",
    notes: text(formData, "notes"),
  });
}

/** Liest die Schnellbearbeitung der Allergene. */
export function parseQuickAllergenForm(formData: FormData) {
  return quickAllergenSchema.safeParse({
    id: text(formData, "id"),
    allergens: formData.getAll("allergens").map(String),
    allergensChecked: formData.get("allergensChecked") === "on",
  });
}

export const mergeSchema = z
  .object({ sourceId: ingredientIdSchema, targetId: ingredientIdSchema })
  .refine((value) => value.sourceId !== value.targetId, {
    error: "Quelle und Ziel müssen verschiedene Zutaten sein.",
    path: ["targetId"],
  });

// ---------------------------------------------------------------------------
// Anzeige
// ---------------------------------------------------------------------------

export interface SupplierInfo {
  name: string;
  /** Woher der Lieferant kommt: von der Zutat selbst oder von der Warengruppe. */
  source: "ingredient" | "group";
}

/** Lieferant einer Zutat: die eigene Angabe, sonst der Standard der Warengruppe, sonst keiner. */
export function resolveSupplier(
  ingredient: { supplierId: string | null; productGroupId: string | null },
  suppliers: ReadonlyMap<string, string>,
  groups: ReadonlyMap<string, { defaultSupplierId: string | null }>,
): SupplierInfo | null {
  if (ingredient.supplierId) {
    const name = suppliers.get(ingredient.supplierId);
    if (name) return { name, source: "ingredient" };
  }
  const groupSupplier = ingredient.productGroupId ? groups.get(ingredient.productGroupId)?.defaultSupplierId : null;
  const name = groupSupplier ? suppliers.get(groupSupplier) : undefined;
  return name ? { name, source: "group" } : null;
}

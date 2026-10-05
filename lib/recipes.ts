/** Rezepte: Eingabeprüfung, Suche, Filter und Anzeigehilfen (SPEC 4.4). Reine Funktionen, ohne Datenbank. */

import { z } from "zod";
import { optionalText } from "./admin";
import { deriveAllergens, type AllergenKey } from "./allergens";
import { formatLong, todayBerlin } from "./dates";
import { foldText } from "./ingredients";
import { COURSES, type Course } from "./types";
import { isUnit } from "./units";

export const COURSE_LABELS: Record<Course, string> = {
  vorspeise: "Vorspeise",
  hauptgang: "Hauptgang",
  nachtisch: "Nachtisch",
};

/** Vorschläge für das freie Feld Kategorie (aus dem Prototyp). Vorhandene Kategorien kommen dazu. */
export const CATEGORY_SUGGESTIONS = [
  "Suppe",
  "Eintopf",
  "Kartoffeln",
  "Teigwaren",
  "Reis",
  "Getreide",
  "Gemüse",
  "Salat",
  "Rohkost",
  "Auflauf",
  "Süßes",
  "Obst",
  "Quark & Joghurt",
  "Brot",
] as const;

export const MAX_RECIPE_LINES = 60;

// ---------------------------------------------------------------------------
// Eingabeprüfung
// ---------------------------------------------------------------------------

/** Zahl aus einem Textfeld, auch mit Komma. Leer ergibt null, Unsinn NaN. */
export function parseAmount(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const text = String(value).trim().replace(/\s+/g, "").replace(",", ".");
  if (text === "") return null;
  return /^\d+(\.\d+)?$/.test(text) || /^\.\d+$/.test(text) ? Number(text) : Number.NaN;
}

const headcount = (label: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? parseAmount(value) ?? Number.NaN : value),
    z
      .number({ error: `${label}: Bitte gib eine ganze Zahl ein.` })
      .int({ error: `${label}: Bitte gib eine ganze Zahl ein.` })
      .min(0, { error: `${label} darf nicht negativ sein.` })
      .max(500, { error: `${label}: Das ist zu viel (höchstens 500).` }),
  );

export const recipeIdSchema = z.uuid({ error: "Unbekanntes Rezept." });

export const recipeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: "Bitte gib einen Namen ein." })
      .max(120, { error: "Der Name ist zu lang (höchstens 120 Zeichen)." }),
    course: z.enum(COURSES, { error: "Bitte wähle einen Gang." }),
    category: optionalText(60),
    baseChildren: headcount("Kinder"),
    baseAdults: headcount("Erwachsene"),
    description: optionalText(500),
    author: optionalText(80),
    steps: z
      .string()
      .max(10_000, { error: "Die Zubereitung ist zu lang (höchstens 10.000 Zeichen)." })
      .transform((text) => splitSteps(text).join("\n"))
      .transform((text) => (text === "" ? null : text)),
    notes: optionalText(2000),
  })
  .refine((recipe) => recipe.baseChildren + recipe.baseAdults > 0, {
    error: "Die Grundmenge braucht mindestens eine Person.",
    path: ["baseChildren"],
  });

export type RecipeInput = z.infer<typeof recipeSchema>;

export interface RecipeLineInput {
  ingredientId: string;
  /** null = nach Bedarf. */
  amount: number | null;
  unit: string | null;
  note: string | null;
}

export type ParsedLines =
  | { success: true; lines: RecipeLineInput[] }
  | { success: false; message: string };

/**
 * Prüft die Zutatenzeilen aus dem Formular (JSON mit Text für die Menge, damit das Komma ankommt).
 * Ganz leere Zeilen entfallen. Eine Zeile mit Menge, Einheit oder Notiz, aber ohne Zutat ist ein Fehler.
 */
export function parseRecipeLines(raw: unknown): ParsedLines {
  if (!Array.isArray(raw)) return { success: false, message: "Die Zutatenliste ist ungültig." };
  if (raw.length > MAX_RECIPE_LINES) {
    return { success: false, message: `Es sind höchstens ${MAX_RECIPE_LINES} Zutaten möglich.` };
  }

  const lines: RecipeLineInput[] = [];
  for (const [index, entry] of raw.entries()) {
    const row = index + 1;
    const item = (typeof entry === "object" && entry !== null ? entry : {}) as Record<string, unknown>;
    const ingredientId = typeof item.ingredientId === "string" ? item.ingredientId.trim() : "";
    const amountText = item.amount == null ? "" : String(item.amount).trim();
    const unit = typeof item.unit === "string" ? item.unit.trim() : "";
    const note = typeof item.note === "string" ? item.note.replace(/\s+/g, " ").trim() : "";

    if (ingredientId === "" && amountText === "" && unit === "" && note === "") continue;
    if (ingredientId === "") {
      return { success: false, message: `Zeile ${row}: Bitte wähle eine Zutat aus.` };
    }
    if (!z.uuid().safeParse(ingredientId).success) {
      return { success: false, message: `Zeile ${row}: Unbekannte Zutat.` };
    }

    const amount = parseAmount(amountText);
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      return { success: false, message: `Zeile ${row}: Bitte gib die Menge als Zahl ein, z. B. 1,5.` };
    }
    if (amount !== null && amount > 1_000_000) {
      return { success: false, message: `Zeile ${row}: Die Menge ist zu groß.` };
    }
    if (unit !== "" && !isUnit(unit)) {
      return { success: false, message: `Zeile ${row}: Unbekannte Einheit.` };
    }
    if (note.length > 100) {
      return { success: false, message: `Zeile ${row}: Die Notiz ist zu lang (höchstens 100 Zeichen).` };
    }

    lines.push({ ingredientId, amount, unit: unit === "" ? null : unit, note: note === "" ? null : note });
  }
  return { success: true, lines };
}

/** Zubereitung in Schritte: jede nicht leere Zeile ist ein Schritt. */
export function splitSteps(steps: string | null | undefined): string[] {
  return (steps ?? "")
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** Zeilen, die in ein Rezept gehören, aber archivierte Zutaten verwenden, die vorher nicht darin standen. */
export function newlyArchivedIngredients(
  lines: readonly RecipeLineInput[],
  archivedIds: ReadonlySet<string>,
  previousIds: ReadonlySet<string>,
): string[] {
  const found = new Set<string>();
  for (const line of lines) {
    if (archivedIds.has(line.ingredientId) && !previousIds.has(line.ingredientId)) found.add(line.ingredientId);
  }
  return [...found];
}

// ---------------------------------------------------------------------------
// Liste: Suche und Filter
// ---------------------------------------------------------------------------

export interface RecipeListIngredient {
  name: string;
  aliases: readonly string[];
  allergens: readonly string[];
  allergensChecked: boolean;
}

export interface RecipeListItem {
  id: string;
  name: string;
  course: Course;
  category: string | null;
  archived: boolean;
  ingredients: readonly RecipeListIngredient[];
}

export interface RecipeFilter {
  q?: string;
  course?: Course | "";
  category?: string;
  /** Schlüssel eines Allergens: nur Rezepte, deren Zutaten dieses Allergen nicht enthalten. */
  withoutAllergen?: AllergenKey | "";
  withArchived?: boolean;
}

export function recipeAllergens(recipe: Pick<RecipeListItem, "ingredients">) {
  return deriveAllergens(recipe.ingredients);
}

/**
 * Filtert und sortiert Rezepte nach Name. Die Suche trifft Name, Kategorie und Zutaten (auch deren
 * Synonyme), jedes Wort der Eingabe muss irgendwo vorkommen.
 *
 * „Ohne Allergen X“ schließt nur Rezepte aus, bei denen X sicher enthalten ist. Rezepte mit ungeprüften
 * Zutaten bleiben in der Liste (siehe `countIncomplete`), sie sind in der Oberfläche als unvollständig markiert.
 */
export function filterRecipes<T extends RecipeListItem>(recipes: readonly T[], filter: RecipeFilter): T[] {
  const words = foldText(filter.q ?? "")
    .split(" ")
    .filter(Boolean);
  const category = foldText(filter.category ?? "");

  return recipes
    .filter((recipe) => {
      if (recipe.archived && !filter.withArchived) return false;
      if (filter.course && recipe.course !== filter.course) return false;
      if (category !== "" && foldText(recipe.category ?? "") !== category) return false;
      if (filter.withoutAllergen && recipeAllergens(recipe).allergens.includes(filter.withoutAllergen)) {
        return false;
      }
      if (words.length > 0) {
        const haystack = [
          foldText(recipe.name),
          foldText(recipe.category ?? ""),
          ...recipe.ingredients.flatMap((ingredient) => [ingredient.name, ...ingredient.aliases].map(foldText)),
        ];
        if (!words.every((word) => haystack.some((text) => text.includes(word)))) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

/** Anzahl Rezepte mit mindestens einer ungeprüften Zutat. */
export function countIncomplete(recipes: readonly Pick<RecipeListItem, "ingredients">[]): number {
  return recipes.filter((recipe) => !recipeAllergens(recipe).complete).length;
}

/** Gruppiert in der Reihenfolge Vorspeise, Hauptgang, Nachtisch und lässt leere Gänge weg. */
export function groupByCourse<T extends { course: Course }>(
  recipes: readonly T[],
): Array<{ course: Course; recipes: T[] }> {
  return COURSES.map((course) => ({ course, recipes: recipes.filter((recipe) => recipe.course === course) })).filter(
    (group) => group.recipes.length > 0,
  );
}

/** Kategorien für die Auswahl: Vorschläge und vorhandene, ohne Doppelte (ohne Groß und Kleinschreibung), sortiert. */
export function categoryOptions(used: readonly (string | null | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const category of [...CATEGORY_SUGGESTIONS, ...used]) {
    const text = category?.trim();
    if (text && !seen.has(foldText(text))) seen.set(foldText(text), text);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "de"));
}

/** Nur die Kategorien, die Rezepte wirklich haben, für den Filter. */
export function usedCategories(recipes: readonly Pick<RecipeListItem, "category">[]): string[] {
  const seen = new Map<string, string>();
  for (const recipe of recipes) {
    const text = recipe.category?.trim();
    if (text && !seen.has(foldText(text))) seen.set(foldText(text), text);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "de"));
}

// ---------------------------------------------------------------------------
// Detail: Termine und Rückmeldungen
// ---------------------------------------------------------------------------

export interface CookingDates {
  /** Letzter Termin vor heute. */
  last: string | null;
  /** Nächster Termin ab heute (heute zählt). */
  next: string | null;
}

/** Zuletzt gekocht und nächster Termin. Geschlossene Tage zählen nicht. */
export function cookingDates(
  dates: readonly string[],
  closedDates: ReadonlySet<string> | readonly string[],
  today: string = todayBerlin(),
): CookingDates {
  const closed = closedDates instanceof Set ? closedDates : new Set(closedDates);
  const open = [...new Set(dates)].filter((date) => !closed.has(date)).sort();
  const past = open.filter((date) => date < today);
  const upcoming = open.filter((date) => date >= today);
  return { last: past.at(-1) ?? null, next: upcoming[0] ?? null };
}

/** „Zuletzt gekocht am 12.10.2026“ bzw. „Noch nicht gekocht“, null wenn es keine Plandaten gibt. */
export function cookingSummary(dates: CookingDates, hasPlanData: boolean): string[] {
  if (!hasPlanData) return [];
  const parts: string[] = [];
  parts.push(dates.last ? `Zuletzt gekocht am ${formatLong(dates.last)}` : "Noch nicht gekocht");
  if (dates.next) parts.push(`Nächster Termin: ${formatLong(dates.next)}`);
  return parts;
}

const AMOUNT_LABELS: Record<string, string> = {
  zu_wenig: "Menge: zu wenig",
  passt: "Menge: passt",
  zu_viel: "Menge: zu viel",
};
const LIKED_LABELS: Record<string, string> = {
  ja: "Geschmeckt: ja",
  geht_so: "Geschmeckt: geht so",
  nein: "Geschmeckt: nein",
};

export interface FeedbackRow {
  date: string;
  amountRating: string | null;
  liked: string | null;
  note: string | null;
}

/** Eine Zeile Text für eine Küchenrückmeldung, z. B. „Menge: passt · Geschmeckt: ja“. */
export function feedbackText(row: Pick<FeedbackRow, "amountRating" | "liked">): string {
  return [row.amountRating ? AMOUNT_LABELS[row.amountRating] : null, row.liked ? LIKED_LABELS[row.liked] : null]
    .filter(Boolean)
    .join(" · ");
}

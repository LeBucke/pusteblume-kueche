/** Schlanke Typen für die Fachlogik. Später an die DB Typen anpassbar. */

export const COURSES = ["vorspeise", "hauptgang", "nachtisch"] as const;
export type Course = (typeof COURSES)[number];

/** Wochentag Montag bis Freitag (1 bis 5). */
export type Weekday = 1 | 2 | 3 | 4 | 5;

/** Anzahl Kinder und Erwachsene. */
export interface Headcount {
  children: number;
  adults: number;
}

export interface Ingredient {
  id: string;
  name: string;
  productGroupId: string | null;
  /** Überschreibt den Standardlieferanten der Warengruppe. */
  supplierId: string | null;
  /** Schlüssel aus der festen Allergenliste. */
  allergens: readonly string[];
  allergensChecked: boolean;
}

export interface RecipeIngredient {
  ingredientId: string;
  /** null = nach Bedarf. */
  amount: number | null;
  unit: string | null;
}

export interface Recipe {
  id: string;
  name: string;
  course: Course;
  baseChildren: number;
  baseAdults: number;
  ingredients: readonly RecipeIngredient[];
}

/** Rezept-IDs je Gang eines Tages. */
export type PlanMeals = Partial<Record<Course, string>>;

export interface PlanDay {
  /** YYYY-MM-DD */
  date: string;
  closed: boolean;
  /** null = Standard aus den Einstellungen. */
  children: number | null;
  adults: number | null;
  meals: PlanMeals;
}

export interface TemplateMeal {
  weekday: Weekday;
  course: Course;
  recipeId: string;
}

export interface WeekTemplate {
  id: string;
  name: string;
  meals: readonly TemplateMeal[];
}

export interface Rotation {
  /** Startmontag, null = keine Rotation eingerichtet. */
  start: string | null;
  /** Vorlagen in Rotationsreihenfolge. */
  templates: readonly WeekTemplate[];
}

export interface Supplier {
  id: string;
  name: string;
  sort: number;
}

export interface ProductGroup {
  id: string;
  name: string;
  defaultSupplierId: string | null;
  sort: number;
}

export interface Settings {
  defaultChildren: number;
  defaultAdults: number;
  adultFactor: number;
}

export interface ShoppingSettings extends Settings {
  suppliers: readonly Supplier[];
  productGroups: readonly ProductGroup[];
}

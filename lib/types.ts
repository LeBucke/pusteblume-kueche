/** Schlanke Typen für die Fachlogik. Enums stammen aus den DB Typen (lib/database.types.ts). */

import type { Database } from "./database.types";

export type Course = Database["public"]["Enums"]["course"];
export type AppRole = Database["public"]["Enums"]["app_role"];

/** Als Tupel, damit Typen und Datenbank nicht auseinanderlaufen (siehe Prüfung darunter). */
export const COURSES = ["vorspeise", "hauptgang", "nachtisch"] as const;
export const APP_ROLES = ["admin", "planung", "kueche", "einkauf"] as const;

// Kompilierfehler, sobald ein Enum in der Datenbank von diesen Listen abweicht.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _coursesMatchDb: Same<(typeof COURSES)[number], Course> = true;
const _rolesMatchDb: Same<(typeof APP_ROLES)[number], AppRole> = true;
void _coursesMatchDb;
void _rolesMatchDb;

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

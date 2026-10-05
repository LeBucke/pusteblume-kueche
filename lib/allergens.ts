/** Die 14 Hauptallergene nach LMIV als feste Liste und die Ableitung für Rezepte. */

export const ALLERGENS = [
  { key: "gluten", name: "Glutenhaltiges Getreide", short: "Gluten" },
  { key: "krebstiere", name: "Krebstiere", short: "Krebstiere" },
  { key: "eier", name: "Eier", short: "Eier" },
  { key: "fisch", name: "Fisch", short: "Fisch" },
  { key: "erdnuesse", name: "Erdnüsse", short: "Erdnüsse" },
  { key: "soja", name: "Soja", short: "Soja" },
  { key: "milch", name: "Milch", short: "Milch" },
  { key: "schalenfruechte", name: "Schalenfrüchte", short: "Nüsse" },
  { key: "sellerie", name: "Sellerie", short: "Sellerie" },
  { key: "senf", name: "Senf", short: "Senf" },
  { key: "sesam", name: "Sesam", short: "Sesam" },
  { key: "sulfite", name: "Schwefeldioxid und Sulfite", short: "Sulfite" },
  { key: "lupinen", name: "Lupinen", short: "Lupinen" },
  { key: "weichtiere", name: "Weichtiere", short: "Weichtiere" },
] as const;

export type AllergenKey = (typeof ALLERGENS)[number]["key"];

export function isAllergenKey(value: string): value is AllergenKey {
  return ALLERGENS.some((a) => a.key === value);
}

export function allergenName(key: AllergenKey): string {
  return ALLERGENS.find((a) => a.key === key)!.name;
}

export function allergenShort(key: AllergenKey): string {
  return ALLERGENS.find((a) => a.key === key)!.short;
}

export interface AllergenSource {
  allergens: readonly string[];
  allergensChecked: boolean;
}

export interface DerivedAllergens {
  /** Vereinigung aller Zutatenallergene in der Reihenfolge der festen Liste. */
  allergens: AllergenKey[];
  /** false, sobald mindestens eine Zutat ungeprüft ist. */
  complete: boolean;
}

/**
 * Leitet die Allergene aus Zutaten ab. Funktioniert für ein Rezept ebenso wie für
 * einen ganzen Tag (alle Zutaten aller Gänge). Unbekannte Schlüssel werden ignoriert.
 */
export function deriveAllergens(ingredients: readonly AllergenSource[]): DerivedAllergens {
  const found = new Set<string>();
  let complete = true;
  for (const ingredient of ingredients) {
    if (!ingredient.allergensChecked) complete = false;
    for (const key of ingredient.allergens) found.add(key);
  }
  return {
    allergens: ALLERGENS.filter((a) => found.has(a.key)).map((a) => a.key),
    complete,
  };
}

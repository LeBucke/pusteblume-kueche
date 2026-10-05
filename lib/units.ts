/** Feste Einheitenliste aus SPEC 6 und Umrechnung in Basiseinheiten. */

export const UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "St.",
  "Pckg.",
  "Dose",
  "Glas",
  "Bund",
  "EL",
  "TL",
  "Prise",
] as const;

export type Unit = (typeof UNITS)[number];

/**
 * - `mass`: g, kg
 * - `volume`: ml, l
 * - `count`: Stückeinheiten (St., Pckg., Dose, Glas, Bund)
 * - `spoon`: EL, TL, Prise
 * - `other`: leere oder unbekannte Einheit
 */
export type UnitFamily = "mass" | "volume" | "count" | "spoon" | "other";

const FAMILIES: Record<Unit, UnitFamily> = {
  g: "mass",
  kg: "mass",
  ml: "volume",
  l: "volume",
  "St.": "count",
  "Pckg.": "count",
  Dose: "count",
  Glas: "count",
  Bund: "count",
  EL: "spoon",
  TL: "spoon",
  Prise: "spoon",
};

export function isUnit(value: string): value is Unit {
  return (UNITS as readonly string[]).includes(value);
}

export function unitFamily(unit: string | null | undefined): UnitFamily {
  return unit && isUnit(unit) ? FAMILIES[unit] : "other";
}

/**
 * Rechnet in die Basiseinheit um: Masse in g, Volumen in ml,
 * alle anderen Einheiten bleiben. Leere Einheit ergibt `""`.
 */
export function toBase(
  amount: number,
  unit: string | null | undefined,
): { amount: number; unit: string } {
  switch (unit) {
    case "kg":
      return { amount: amount * 1000, unit: "g" };
    case "l":
      return { amount: amount * 1000, unit: "ml" };
    default:
      return { amount, unit: unit ?? "" };
  }
}

/** Portionen, Skalierung und Mengenanzeige nach SPEC 6. */

import type { Headcount } from "./types";
import { toBase, unitFamily } from "./units";

/** Kinderportionen für eine Gruppe: Kinder plus Erwachsene mal Erwachsenenfaktor. */
export function portions(children: number, adults: number, adultFactor: number): number {
  return children + adults * adultFactor;
}

/** Faktor Zielgruppe zu Grundmenge. Ohne Portionen in der Grundmenge 0. */
export function scaleFactor(
  recipeBase: Headcount,
  target: Headcount,
  adultFactor: number,
): number {
  const base = portions(recipeBase.children, recipeBase.adults, adultFactor);
  if (!(base > 0)) return 0;
  return Math.max(0, portions(target.children, target.adults, adultFactor)) / base;
}

export type AmountContext = "recipe" | "shopping" | "parents";

/** Zahl mit höchstens `maxDecimals` Nachkommastellen, deutsches Komma, ohne Endnullen. */
export function formatNumber(value: number, maxDecimals = 2): string {
  const text = value.toFixed(maxDecimals);
  const trimmed = text.includes(".") ? text.replace(/\.?0+$/, "") : text;
  return trimmed.replace(".", ",");
}

function withUnit(text: string, unit: string): string {
  return unit ? `${text} ${unit}` : text;
}

/** Rundet auf ein Vielfaches von `step`, wobei positive Werte nie unter `step` fallen. */
function roundToStep(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

/**
 * Menge für die Anzeige.
 *
 * - g und ml: unter 100 ganze Zahlen (mindestens 1), ab 100 auf Zehner,
 *   ab 1000 in kg oder l mit einer Nachkommastelle.
 * - Stückeinheiten: im Rezept und in der Elternansicht auf halbe Stücke
 *   (mindestens 0,5), im Einkauf aufrunden.
 * - EL, TL, Prise: eine Nachkommastelle.
 *
 * `value` ist in `unit` angegeben (auch kg und l möglich). Ohne Menge
 * kommt „nach Bedarf“ zurück.
 */
export function formatAmount(
  value: number | null | undefined,
  unit: string | null | undefined,
  context: AmountContext,
): string {
  if (value == null || !Number.isFinite(value)) return "nach Bedarf";

  const base = toBase(value, unit);
  if (base.amount <= 0) return withUnit("0", base.unit);

  switch (unitFamily(base.unit)) {
    case "mass":
    case "volume": {
      const rounded =
        base.amount < 100
          ? Math.max(1, Math.round(base.amount))
          : Math.round(base.amount / 10) * 10;
      if (rounded >= 1000) {
        const big = base.unit === "g" ? "kg" : "l";
        const text = (Math.round(rounded / 100) / 10).toFixed(1).replace(".", ",");
        return withUnit(text, big);
      }
      return withUnit(String(rounded), base.unit);
    }
    case "count": {
      const n = context === "shopping" ? Math.ceil(base.amount - 1e-9) : roundToStep(base.amount, 0.5);
      return withUnit(formatNumber(n, 1), base.unit);
    }
    case "spoon":
      return withUnit(formatNumber(roundToStep(base.amount, 0.1), 1), base.unit);
    default:
      return withUnit(formatNumber(Math.round(base.amount * 100) / 100, 2), base.unit);
  }
}

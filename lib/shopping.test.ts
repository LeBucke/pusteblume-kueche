import { describe, expect, it } from "vitest";
import { NO_GROUP, NO_SUPPLIER, aggregateShopping, toShareText } from "./shopping";
import type { Ingredient, PlanDay, Recipe, ShoppingSettings } from "./types";

const settings: ShoppingSettings = {
  defaultChildren: 20,
  defaultAdults: 5,
  adultFactor: 1.5,
  suppliers: [
    { id: "bio", name: "Biobauer", sort: 1 },
    { id: "gross", name: "Großhandel", sort: 2 },
  ],
  productGroups: [
    { id: "gemuese", name: "Gemüse", defaultSupplierId: "bio", sort: 1 },
    { id: "getreide", name: "Getreide und Teigwaren", defaultSupplierId: "gross", sort: 2 },
    { id: "gewuerze", name: "Gewürze", defaultSupplierId: "gross", sort: 3 },
  ],
};

function ingredient(id: string, name: string, productGroupId: string | null, supplierId: string | null = null): Ingredient {
  return { id, name, productGroupId, supplierId, allergens: [], allergensChecked: true };
}

const ingredients: Ingredient[] = [
  ingredient("kartoffeln", "Kartoffeln", "gemuese"),
  ingredient("moehren", "Möhren", "gemuese"),
  ingredient("nudeln", "Nudeln", "getreide"),
  ingredient("salz", "Salz", "gewuerze"),
  ingredient("pfeffer", "Pfeffer", "gewuerze"),
];

const gratin: Recipe = {
  id: "gratin",
  name: "Kartoffelgratin",
  course: "hauptgang",
  baseChildren: 20,
  baseAdults: 5,
  ingredients: [
    { ingredientId: "kartoffeln", amount: 6000, unit: "g" },
    { ingredientId: "salz", amount: null, unit: null },
    { ingredientId: "pfeffer", amount: null, unit: null },
  ],
};

const suppe: Recipe = {
  id: "suppe",
  name: "Gemüsesuppe",
  course: "vorspeise",
  baseChildren: 20,
  baseAdults: 5,
  ingredients: [
    { ingredientId: "kartoffeln", amount: 2.5, unit: "kg" },
    { ingredientId: "moehren", amount: 1000, unit: "g" },
    { ingredientId: "moehren", amount: 4, unit: "St." },
    { ingredientId: "nudeln", amount: 1500, unit: "g" },
    { ingredientId: "salz", amount: 2, unit: "EL" },
  ],
};

function day(date: string, meals: PlanDay["meals"], extra: Partial<PlanDay> = {}): PlanDay {
  return { date, closed: false, children: null, adults: null, meals, ...extra };
}

describe("aggregateShopping", () => {
  const plan = [
    day("2026-10-12", { hauptgang: "gratin" }),
    day("2026-10-13", { vorspeise: "suppe" }),
  ];
  const result = aggregateShopping(plan, [gratin, suppe], ingredients, settings);
  const byKey = new Map(result.items.map((i) => [i.key, i]));

  it("summiert kg und g derselben Zutat in der Basiseinheit", () => {
    const kartoffeln = byKey.get("kartoffeln:g");
    expect(kartoffeln?.amount).toBe(8500);
    expect(kartoffeln?.recipeNames).toEqual(["Gemüsesuppe", "Kartoffelgratin"]);
    expect(kartoffeln?.mixedUnits).toBe(false);
  });

  it("trennt Zeilen bei verschiedenen Einheitenfamilien und markiert sie", () => {
    expect(byKey.get("moehren:g")?.amount).toBe(1000);
    expect(byKey.get("moehren:St.")?.amount).toBe(4);
    expect(byKey.get("moehren:g")?.mixedUnits).toBe(true);
    expect(byKey.get("moehren:St.")?.mixedUnits).toBe(true);
  });

  it("ordnet Lieferant und Warengruppe zu", () => {
    expect(byKey.get("kartoffeln:g")).toMatchObject({
      supplierId: "bio",
      supplierName: "Biobauer",
      productGroupId: "gemuese",
      productGroupName: "Gemüse",
    });
    expect(byKey.get("nudeln:g")).toMatchObject({ supplierId: "gross", productGroupName: "Getreide und Teigwaren" });
  });

  it("sortiert nach Lieferant, Warengruppe und Name", () => {
    expect(result.items.map((i) => i.key)).toEqual([
      "kartoffeln:g",
      "moehren:g",
      "moehren:St.",
      "nudeln:g",
      "salz:EL",
    ]);
  });

  it("führt Zutaten ohne Menge unter Vorrat prüfen, wenn sie nirgends eine Menge haben", () => {
    expect(result.pantry.map((p) => p.name)).toEqual(["Pfeffer"]);
    expect(result.pantry[0].recipeNames).toEqual(["Kartoffelgratin"]);
  });

  it("rechnet mit dem Faktor des Tages", () => {
    const small = aggregateShopping(
      [day("2026-10-12", { hauptgang: "gratin" }, { children: 2, adults: 2 })],
      [gratin],
      ingredients,
      settings,
    );
    expect(small.items[0].amount).toBeCloseTo(6000 * (5 / 27.5), 6);
  });

  it("nutzt die Standardwerte, wenn der Tag keine Zahlen hat", () => {
    const same = aggregateShopping([day("2026-10-12", { hauptgang: "gratin" })], [gratin], ingredients, settings);
    expect(same.items[0].amount).toBe(6000);
  });

  it("zählt geschlossene Tage nicht", () => {
    const closed = aggregateShopping(
      [day("2026-10-12", { hauptgang: "gratin" }, { closed: true })],
      [gratin],
      ingredients,
      settings,
    );
    expect(closed).toEqual({ items: [], pantry: [] });
  });

  it("liefert bei 0 Personen keine Positionen", () => {
    const zero = aggregateShopping(
      [day("2026-10-12", { hauptgang: "gratin" }, { children: 0, adults: 0 })],
      [gratin],
      ingredients,
      settings,
    );
    expect(zero.items).toEqual([]);
  });

  it("summiert dasselbe Rezept an mehreren Tagen", () => {
    const twice = aggregateShopping(
      [day("2026-10-12", { hauptgang: "gratin" }), day("2026-10-13", { hauptgang: "gratin" })],
      [gratin],
      ingredients,
      settings,
    );
    expect(twice.items[0].amount).toBe(12000);
    expect(twice.items[0].recipeNames).toEqual(["Kartoffelgratin"]);
  });

  it("überspringt unbekannte Rezepte und Zutaten", () => {
    const unknown = aggregateShopping(
      [day("2026-10-12", { hauptgang: "gibt-es-nicht", vorspeise: "x" })],
      [{ ...gratin, id: "x", ingredients: [{ ingredientId: "fehlt", amount: 1, unit: "g" }] }],
      ingredients,
      settings,
    );
    expect(unknown).toEqual({ items: [], pantry: [] });
  });

  it("bevorzugt den Lieferanten der Zutat vor dem der Warengruppe", () => {
    const own = aggregateShopping(
      [day("2026-10-12", { hauptgang: "gratin" })],
      [gratin],
      [ingredient("kartoffeln", "Kartoffeln", "gemuese", "gross"), ...ingredients.slice(1)],
      settings,
    );
    expect(own.items[0]).toMatchObject({ supplierId: "gross", supplierName: "Großhandel" });
  });

  it("fängt fehlende Warengruppe und Lieferant auf und sortiert sie ans Ende", () => {
    const loose = aggregateShopping(
      [day("2026-10-12", { hauptgang: "gratin" })],
      [gratin],
      [ingredient("kartoffeln", "Kartoffeln", null), ...ingredients.slice(1)],
      settings,
    );
    expect(loose.items[0]).toMatchObject({
      supplierId: null,
      supplierName: NO_SUPPLIER,
      productGroupId: null,
      productGroupName: NO_GROUP,
    });
  });

  it("verarbeitet ungeprüfte Zutaten wie geprüfte (Allergene betreffen den Einkauf nicht)", () => {
    const unchecked = aggregateShopping(
      [day("2026-10-12", { hauptgang: "gratin" })],
      [gratin],
      [{ ...ingredients[0], allergensChecked: false }, ...ingredients.slice(1)],
      settings,
    );
    expect(unchecked.items).toHaveLength(1);
  });
});

describe("toShareText", () => {
  const { items } = aggregateShopping(
    [day("2026-10-12", { hauptgang: "gratin" }), day("2026-10-13", { vorspeise: "suppe" })],
    [gratin, suppe],
    ingredients,
    settings,
  );
  const range = { from: "2026-10-12", to: "2026-10-16" };

  it("erzeugt das Format aus SPEC 4.8", () => {
    const text = toShareText({ id: "bio", name: "Biobauer" }, items, range, new Set());
    expect(text).toBe(
      ["Einkauf Biobauer für 12.10. bis 16.10.", "", "Gemüse", "Kartoffeln: 8,5 kg", "Möhren: 1,0 kg", "Möhren: 4 St."].join("\n"),
    );
  });

  it("lässt abgehakte Positionen weg", () => {
    const text = toShareText({ id: "bio", name: "Biobauer" }, items, range, new Set(["moehren:g", "kartoffeln:g"]));
    expect(text).toBe(["Einkauf Biobauer für 12.10. bis 16.10.", "", "Gemüse", "Möhren: 4 St."].join("\n"));
  });

  it("nimmt nur Positionen des Lieferanten", () => {
    const text = toShareText({ id: "gross", name: "Großhandel" }, items, range, new Set());
    expect(text).toBe(
      ["Einkauf Großhandel für 12.10. bis 16.10.", "", "Getreide und Teigwaren", "Nudeln: 1,5 kg", "", "Gewürze", "Salz: 2 EL"].join("\n"),
    );
  });

  it("gibt ohne offene Positionen nur die Kopfzeile aus", () => {
    const all = new Set(items.map((i) => i.key));
    expect(toShareText({ id: "bio", name: "Biobauer" }, items, range, all)).toBe(
      "Einkauf Biobauer für 12.10. bis 16.10.",
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  categoryOptions,
  cookingDates,
  cookingSummary,
  countIncomplete,
  feedbackText,
  filterRecipes,
  groupByCourse,
  newlyArchivedIngredients,
  parseAmount,
  parseRecipeLines,
  recipeSchema,
  splitSteps,
  usedCategories,
  type RecipeListItem,
} from "./recipes";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

describe("parseAmount", () => {
  it("liest Komma und Punkt", () => {
    expect(parseAmount("1,5")).toBe(1.5);
    expect(parseAmount("1.5")).toBe(1.5);
    expect(parseAmount(" 6000 ")).toBe(6000);
    expect(parseAmount(",5")).toBe(0.5);
  });

  it("gibt für leer null und für Unsinn NaN", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("  ")).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount("viel")).toBeNaN();
    expect(parseAmount("1,2,3")).toBeNaN();
    expect(parseAmount("-2")).toBeNaN();
  });
});

describe("parseRecipeLines", () => {
  it("übernimmt Zeilen in Reihenfolge und rechnet das Komma", () => {
    const result = parseRecipeLines([
      { ingredientId: ID_A, amount: "1,5", unit: "kg", note: " gewürfelt " },
      { ingredientId: ID_B, amount: "", unit: "", note: "" },
    ]);
    expect(result).toEqual({
      success: true,
      lines: [
        { ingredientId: ID_A, amount: 1.5, unit: "kg", note: "gewürfelt" },
        { ingredientId: ID_B, amount: null, unit: null, note: null },
      ],
    });
  });

  it("lässt ganz leere Zeilen weg", () => {
    const result = parseRecipeLines([{ ingredientId: "", amount: "", unit: "", note: "" }, { ingredientId: ID_A }]);
    expect(result).toMatchObject({ success: true });
    expect(result.success && result.lines).toHaveLength(1);
  });

  it("meldet eine Zeile mit Menge, aber ohne Zutat mit der Zeilennummer", () => {
    const result = parseRecipeLines([{ ingredientId: ID_A }, { ingredientId: "", amount: "200", unit: "g" }]);
    expect(result).toEqual({ success: false, message: "Zeile 2: Bitte wähle eine Zutat aus." });
  });

  it("lehnt unlesbare und negative Mengen, unbekannte Einheiten und fremde IDs ab", () => {
    expect(parseRecipeLines([{ ingredientId: ID_A, amount: "viel" }])).toMatchObject({ success: false });
    expect(parseRecipeLines([{ ingredientId: ID_A, amount: "-1" }])).toMatchObject({ success: false });
    expect(parseRecipeLines([{ ingredientId: ID_A, amount: "1", unit: "Eimer" }])).toMatchObject({ success: false });
    expect(parseRecipeLines([{ ingredientId: "abc", amount: "1" }])).toMatchObject({ success: false });
    expect(parseRecipeLines("nein")).toMatchObject({ success: false });
  });

  it("erlaubt eine Einheit ohne Menge (nach Bedarf)", () => {
    const result = parseRecipeLines([{ ingredientId: ID_A, amount: "", unit: "Prise" }]);
    expect(result.success && result.lines[0]).toEqual({ ingredientId: ID_A, amount: null, unit: "Prise", note: null });
  });
});

describe("recipeSchema", () => {
  const valid = {
    name: " Kartoffelgratin ",
    course: "hauptgang",
    category: "",
    baseChildren: "20",
    baseAdults: "5",
    description: "",
    author: " Paul ",
    steps: "Backofen vorheizen.\r\n\r\n  Kartoffeln schälen.  \n",
    notes: "",
  };

  it("bereinigt Eingaben", () => {
    const result = recipeSchema.parse(valid);
    expect(result).toMatchObject({
      name: "Kartoffelgratin",
      course: "hauptgang",
      category: null,
      baseChildren: 20,
      baseAdults: 5,
      author: "Paul",
      steps: "Backofen vorheizen.\nKartoffeln schälen.",
    });
  });

  it("verlangt Namen, gültigen Gang und mindestens eine Person", () => {
    expect(recipeSchema.safeParse({ ...valid, name: " " }).success).toBe(false);
    expect(recipeSchema.safeParse({ ...valid, course: "dessert" }).success).toBe(false);
    expect(recipeSchema.safeParse({ ...valid, baseChildren: "0", baseAdults: "0" }).success).toBe(false);
    expect(recipeSchema.safeParse({ ...valid, baseChildren: "0", baseAdults: "2" }).success).toBe(true);
    expect(recipeSchema.safeParse({ ...valid, baseChildren: "2,5" }).success).toBe(false);
  });

  it("macht aus einer leeren Zubereitung null", () => {
    expect(recipeSchema.parse({ ...valid, steps: " \n " }).steps).toBeNull();
  });
});

describe("splitSteps", () => {
  it("macht aus jeder nicht leeren Zeile einen Schritt", () => {
    expect(splitSteps("Eins\n\n Zwei \r\nDrei")).toEqual(["Eins", "Zwei", "Drei"]);
    expect(splitSteps(null)).toEqual([]);
  });
});

describe("newlyArchivedIngredients", () => {
  const line = (ingredientId: string) => ({ ingredientId, amount: 1, unit: null, note: null });

  it("meldet archivierte Zutaten, die vorher nicht im Rezept standen", () => {
    const archived = new Set([ID_A, ID_B]);
    expect(newlyArchivedIngredients([line(ID_A), line(ID_B)], archived, new Set([ID_A]))).toEqual([ID_B]);
    expect(newlyArchivedIngredients([line(ID_A)], new Set(), new Set())).toEqual([]);
  });
});

function recipe(overrides: Partial<RecipeListItem> & { name: string }): RecipeListItem {
  return {
    id: overrides.name,
    course: "hauptgang",
    category: null,
    archived: false,
    ingredients: [],
    ...overrides,
  };
}

const milch = { name: "Milch", aliases: [], allergens: ["milch"], allergensChecked: true };
const moehre = { name: "Möhren", aliases: ["Karotte"], allergens: [], allergensChecked: true };
const ungeprueft = { name: "Brühe", aliases: [], allergens: [], allergensChecked: false };

describe("filterRecipes", () => {
  const recipes = [
    recipe({ name: "Kartoffelgratin", category: "Auflauf", ingredients: [milch] }),
    recipe({ name: "Rohkost mit Dipp", course: "vorspeise", category: "Rohkost", ingredients: [moehre] }),
    recipe({ name: "Obst", course: "nachtisch", category: "Obst" }),
    recipe({ name: "Alte Suppe", category: "Suppe", archived: true, ingredients: [ungeprueft] }),
  ];
  const names = (list: RecipeListItem[]) => list.map((r) => r.name);

  it("blendet Archivierte aus und sortiert nach Name", () => {
    expect(names(filterRecipes(recipes, {}))).toEqual(["Kartoffelgratin", "Obst", "Rohkost mit Dipp"]);
    expect(names(filterRecipes(recipes, { withArchived: true }))).toContain("Alte Suppe");
  });

  it("sucht in Name, Kategorie und Zutaten, auch über Synonyme und ohne Umlaut", () => {
    expect(names(filterRecipes(recipes, { q: "gratin" }))).toEqual(["Kartoffelgratin"]);
    expect(names(filterRecipes(recipes, { q: "auflauf" }))).toEqual(["Kartoffelgratin"]);
    expect(names(filterRecipes(recipes, { q: "mohren" }))).toEqual(["Rohkost mit Dipp"]);
    expect(names(filterRecipes(recipes, { q: "karotte" }))).toEqual(["Rohkost mit Dipp"]);
    expect(names(filterRecipes(recipes, { q: "rohkost karotte" }))).toEqual(["Rohkost mit Dipp"]);
    expect(filterRecipes(recipes, { q: "pizza" })).toEqual([]);
  });

  it("filtert nach Gang und Kategorie", () => {
    expect(names(filterRecipes(recipes, { course: "vorspeise" }))).toEqual(["Rohkost mit Dipp"]);
    expect(names(filterRecipes(recipes, { category: "obst" }))).toEqual(["Obst"]);
  });

  it("schließt mit „ohne Allergen“ nur Rezepte mit sicher enthaltenem Allergen aus", () => {
    expect(names(filterRecipes(recipes, { withoutAllergen: "milch" }))).toEqual(["Obst", "Rohkost mit Dipp"]);
  });

  it("behält Rezepte mit ungeprüften Zutaten bei „ohne Allergen“, sie zählen aber als unvollständig", () => {
    const list = [...recipes, recipe({ name: "Brühreis", ingredients: [ungeprueft] })];
    const result = filterRecipes(list, { withoutAllergen: "milch" });
    expect(names(result)).toContain("Brühreis");
    expect(countIncomplete(result)).toBe(1);
  });
});

describe("groupByCourse", () => {
  it("ordnet Vorspeise, Hauptgang, Nachtisch und lässt leere Gänge weg", () => {
    const groups = groupByCourse([
      recipe({ name: "A", course: "nachtisch" }),
      recipe({ name: "B", course: "vorspeise" }),
      recipe({ name: "C", course: "nachtisch" }),
    ]);
    expect(groups.map((g) => [g.course, g.recipes.length])).toEqual([
      ["vorspeise", 1],
      ["nachtisch", 2],
    ]);
  });
});

describe("Kategorien", () => {
  it("categoryOptions mischt Vorschläge und vorhandene ohne Doppelte", () => {
    const options = categoryOptions(["suppe", "Pizza", null, "  "]);
    expect(options.filter((c) => c.toLowerCase() === "suppe")).toHaveLength(1);
    expect(options).toContain("Pizza");
  });

  it("usedCategories nennt nur vorhandene", () => {
    expect(usedCategories([{ category: "Suppe" }, { category: "suppe" }, { category: null }, { category: "Obst" }])).toEqual(
      ["Obst", "Suppe"],
    );
  });
});

describe("cookingDates", () => {
  const today = "2026-10-14";

  it("findet letzten und nächsten Termin, heute zählt als nächster", () => {
    expect(cookingDates(["2026-10-01", "2026-10-07", "2026-10-14", "2026-10-21"], [], today)).toEqual({
      last: "2026-10-07",
      next: "2026-10-14",
    });
  });

  it("ignoriert geschlossene Tage und Doppelte", () => {
    expect(cookingDates(["2026-10-07", "2026-10-07", "2026-10-10"], ["2026-10-10"], today)).toEqual({
      last: "2026-10-07",
      next: null,
    });
  });

  it("gibt ohne Termine zweimal null", () => {
    expect(cookingDates([], [], today)).toEqual({ last: null, next: null });
  });
});

describe("cookingSummary", () => {
  it("bleibt ohne Plandaten leer", () => {
    expect(cookingSummary({ last: null, next: null }, false)).toEqual([]);
  });

  it("nennt Termine im deutschen Format", () => {
    expect(cookingSummary({ last: "2026-10-07", next: "2026-10-21" }, true)).toEqual([
      "Zuletzt gekocht am 07.10.2026",
      "Nächster Termin: 21.10.2026",
    ]);
    expect(cookingSummary({ last: null, next: null }, true)).toEqual(["Noch nicht gekocht"]);
  });
});

describe("feedbackText", () => {
  it("verbindet Menge und Geschmack", () => {
    expect(feedbackText({ amountRating: "passt", liked: "ja" })).toBe("Menge: passt · Geschmeckt: ja");
    expect(feedbackText({ amountRating: "zu_viel", liked: null })).toBe("Menge: zu viel");
    expect(feedbackText({ amountRating: null, liked: null })).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import {
  conflictMessage,
  findConflicts,
  foldText,
  ingredientSchema,
  mergeSchema,
  parseAliases,
  parseIngredientForm,
  parseQuickAllergenForm,
  quickAllergenSchema,
  resolveSupplier,
  searchIngredients,
} from "./ingredients";

const UUID_A = "3f2b8c1e-5a4d-4e6f-8a7b-9c0d1e2f3a4b";
const UUID_B = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

const ingredients = [
  { id: "1", name: "Möhren", aliases: ["Möhre", "Karotten"] },
  { id: "2", name: "Kartoffeln", aliases: [] },
  { id: "3", name: "Tomaten (Dose)", aliases: ["Dosentomaten", "Pelati"] },
  { id: "4", name: "Mohrrübenmark", aliases: [] },
];

describe("foldText", () => {
  it("ignoriert Groß und Kleinschreibung, Akzente und ß", () => {
    expect(foldText("  MÖHRE ")).toBe("mohre");
    expect(foldText("Soße")).toBe("sosse");
    expect(foldText("rote   Bete")).toBe("rote bete");
  });
});

describe("parseAliases", () => {
  it("trennt bei Komma, Semikolon und Zeilenumbruch, ohne Leere und Doppelte", () => {
    expect(parseAliases("Möhre, Karotte;\nmöhre ,, Gelbe Rübe")).toEqual(["Möhre", "Karotte", "Gelbe Rübe"]);
  });

  it("lässt den eigenen Namen weg", () => {
    expect(parseAliases("Möhren, Möhre", "möhren")).toEqual(["Möhre"]);
  });
});

describe("searchIngredients", () => {
  it("findet „Möhren“ über das Synonym „Möhre“ und über den Namen", () => {
    expect(searchIngredients(ingredients, "Möhre").map((i) => i.id)).toEqual(["1"]);
    expect(searchIngredients(ingredients, "karotte").map((i) => i.id)).toEqual(["1"]);
  });

  it("findet auch ohne Umlaut und mit Teilwort", () => {
    expect(searchIngredients(ingredients, "mohre").map((i) => i.id)).toEqual(["1"]);
    expect(searchIngredients(ingredients, "mohr").map((i) => i.id)).toEqual(["1", "4"]);
    expect(searchIngredients(ingredients, "tomat").map((i) => i.id)).toEqual(["3"]);
  });

  it("verlangt bei mehreren Wörtern alle", () => {
    expect(searchIngredients(ingredients, "tomaten dose").map((i) => i.id)).toEqual(["3"]);
    expect(searchIngredients(ingredients, "tomaten kartoffeln")).toEqual([]);
  });

  it("sortiert Namenstreffer vor Synonymtreffern", () => {
    const list = [
      { id: "a", name: "Gelbe Rübe", aliases: ["Möhre"] },
      { id: "b", name: "Möhre, gerieben", aliases: [] },
    ];
    expect(searchIngredients(list, "möhre").map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("gibt bei leerer Eingabe alle nach Name zurück und verändert die Eingabe nicht", () => {
    expect(searchIngredients(ingredients, "  ").map((i) => i.id)).toEqual(["2", "1", "4", "3"]);
    expect(ingredients[0].id).toBe("1");
  });
});

describe("findConflicts", () => {
  it("meldet einen gleichen Namen, auch mit anderer Schreibung", () => {
    const conflicts = findConflicts({ name: "kartoffeln", aliases: [] }, ingredients);
    expect(conflicts).toEqual([{ ingredientId: "2", ingredientName: "Kartoffeln", value: "kartoffeln", with: "name" }]);
  });

  it("meldet einen Namen, der bei einer anderen Zutat Synonym ist", () => {
    const conflicts = findConflicts({ name: "Möhre", aliases: [] }, ingredients);
    expect(conflicts).toEqual([{ ingredientId: "1", ingredientName: "Möhren", value: "Möhre", with: "alias" }]);
  });

  it("meldet ein Synonym, das bei einer anderen Zutat Name oder Synonym ist", () => {
    const conflicts = findConflicts({ name: "Rüebli", aliases: ["Kartoffeln", "Pelati"] }, ingredients);
    expect(conflicts.map((c) => [c.value, c.ingredientId, c.with])).toEqual([
      ["Kartoffeln", "2", "name"],
      ["Pelati", "3", "alias"],
    ]);
  });

  it("ignoriert die Zutat selbst beim Bearbeiten", () => {
    expect(findConflicts({ id: "1", name: "Möhren", aliases: ["Möhre"] }, ingredients)).toEqual([]);
  });

  it("meldet nichts bei neuen Namen", () => {
    expect(findConflicts({ name: "Zucchini", aliases: ["Courgette"] }, ingredients)).toEqual([]);
  });

  it("formuliert den Hinweis mit dem Namen der vorhandenen Zutat", () => {
    const [conflict] = findConflicts({ name: "Möhre", aliases: [] }, ingredients);
    expect(conflictMessage(conflict)).toBe(
      "„Möhre“ ist schon ein Synonym der Zutat „Möhren“. Nimm die vorhandene Zutat oder führe beide zusammen.",
    );
    const [byName] = findConflicts({ name: "Kartoffeln", aliases: [] }, ingredients);
    expect(conflictMessage(byName)).toBe(
      "„Kartoffeln“ gibt es schon als Zutat. Nimm die vorhandene Zutat oder führe beide zusammen.",
    );
  });
});

describe("ingredientSchema", () => {
  const input = {
    name: "  Möhren ",
    aliases: "Möhre, Karotte, möhren",
    productGroupId: UUID_A,
    defaultUnit: "kg",
    supplierId: "",
    allergens: ["sellerie", "gluten"],
    allergensChecked: true,
    notes: "",
  };

  it("bereinigt Eingaben, ordnet die Allergene wie die feste Liste und leert optionale Felder", () => {
    expect(ingredientSchema.parse(input)).toEqual({
      name: "Möhren",
      aliases: ["Möhre", "Karotte"],
      productGroupId: UUID_A,
      defaultUnit: "kg",
      supplierId: null,
      allergens: ["gluten", "sellerie"],
      allergensChecked: true,
      notes: null,
    });
  });

  it("verlangt einen Namen", () => {
    expect(ingredientSchema.safeParse({ ...input, name: "  " }).error?.issues[0].message).toBe(
      "Bitte gib einen Namen ein.",
    );
  });

  it("weist unbekannte Allergene, Einheiten und IDs ab", () => {
    expect(ingredientSchema.safeParse({ ...input, allergens: ["erdbeeren"] }).success).toBe(false);
    expect(ingredientSchema.safeParse({ ...input, defaultUnit: "Eimer" }).success).toBe(false);
    expect(ingredientSchema.safeParse({ ...input, supplierId: "x" }).success).toBe(false);
  });

  it("erlaubt eine leere Standardeinheit und keine Allergene", () => {
    const parsed = ingredientSchema.parse({ ...input, defaultUnit: "", allergens: [] });
    expect(parsed.defaultUnit).toBeNull();
    expect(parsed.allergens).toEqual([]);
  });
});

describe("quickAllergenSchema und mergeSchema", () => {
  it("prüft die Schnellbearbeitung", () => {
    expect(quickAllergenSchema.parse({ id: UUID_A, allergens: ["milch"], allergensChecked: false })).toEqual({
      id: UUID_A,
      allergens: ["milch"],
      allergensChecked: false,
    });
    expect(quickAllergenSchema.safeParse({ id: "x", allergens: [], allergensChecked: true }).success).toBe(false);
  });

  it("verlangt verschiedene Zutaten zum Zusammenführen", () => {
    expect(mergeSchema.safeParse({ sourceId: UUID_A, targetId: UUID_B }).success).toBe(true);
    expect(mergeSchema.safeParse({ sourceId: UUID_A, targetId: UUID_A }).error?.issues[0].message).toBe(
      "Quelle und Ziel müssen verschiedene Zutaten sein.",
    );
  });
});

describe("resolveSupplier", () => {
  const suppliers = new Map([
    ["s1", "Metzger Müller"],
    ["s2", "Großmarkt"],
  ]);
  const groups = new Map([["g1", { defaultSupplierId: "s2" }]]);

  it("nimmt den eigenen Lieferanten vor dem der Warengruppe", () => {
    expect(resolveSupplier({ supplierId: "s1", productGroupId: "g1" }, suppliers, groups)).toEqual({
      name: "Metzger Müller",
      source: "ingredient",
    });
  });

  it("fällt auf den Standardlieferanten der Warengruppe zurück", () => {
    expect(resolveSupplier({ supplierId: null, productGroupId: "g1" }, suppliers, groups)).toEqual({
      name: "Großmarkt",
      source: "group",
    });
  });

  it("gibt null zurück, wenn keiner feststeht", () => {
    expect(resolveSupplier({ supplierId: null, productGroupId: null }, suppliers, groups)).toBeNull();
    expect(resolveSupplier({ supplierId: null, productGroupId: "g2" }, suppliers, groups)).toBeNull();
  });
});

describe("Formulardaten", () => {
  function form(entries: Array<[string, string]>): FormData {
    const data = new FormData();
    for (const [key, value] of entries) data.append(key, value);
    return data;
  }

  it("liest Allergene und den Haken „geprüft“ aus dem Formular, ohne Haken ist die Zutat ungeprüft", () => {
    const parsed = parseIngredientForm(
      form([
        ["name", "Nudeln"],
        ["aliases", "Pasta"],
        ["productGroupId", ""],
        ["defaultUnit", "g"],
        ["supplierId", ""],
        ["allergens", "eier"],
        ["allergens", "gluten"],
        ["notes", ""],
      ]),
    );
    expect(parsed.success && parsed.data.allergens).toEqual(["gluten", "eier"]);
    expect(parsed.success && parsed.data.allergensChecked).toBe(false);
    expect(parsed.success && parsed.data.aliases).toEqual(["Pasta"]);

    const checked = parseQuickAllergenForm(
      form([
        ["id", UUID_A],
        ["allergensChecked", "on"],
      ]),
    );
    expect(checked.success && checked.data).toEqual({ id: UUID_A, allergens: [], allergensChecked: true });
  });
});

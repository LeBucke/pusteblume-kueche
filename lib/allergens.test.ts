import { describe, expect, it } from "vitest";
import { ALLERGENS, allergenName, allergenShort, deriveAllergens, isAllergenKey } from "./allergens";

describe("ALLERGENS", () => {
  it("enthält genau die 14 Hauptallergene mit eindeutigen Schlüsseln", () => {
    expect(ALLERGENS).toHaveLength(14);
    expect(new Set(ALLERGENS.map((a) => a.key)).size).toBe(14);
  });

  it("liefert Lang- und Kurznamen", () => {
    expect(allergenName("gluten")).toBe("Glutenhaltiges Getreide");
    expect(allergenShort("gluten")).toBe("Gluten");
    expect(allergenName("sulfite")).toBe("Schwefeldioxid und Sulfite");
  });

  it("erkennt gültige Schlüssel", () => {
    expect(isAllergenKey("milch")).toBe(true);
    expect(isAllergenKey("Milch")).toBe(false);
  });
});

describe("deriveAllergens", () => {
  it("vereinigt die Allergene aller Zutaten in Listenreihenfolge", () => {
    const result = deriveAllergens([
      { allergens: ["milch"], allergensChecked: true },
      { allergens: ["eier", "gluten"], allergensChecked: true },
      { allergens: ["milch"], allergensChecked: true },
    ]);
    expect(result).toEqual({ allergens: ["gluten", "eier", "milch"], complete: true });
  });

  it("ist unvollständig, sobald eine Zutat ungeprüft ist", () => {
    const result = deriveAllergens([
      { allergens: ["milch"], allergensChecked: true },
      { allergens: [], allergensChecked: false },
    ]);
    expect(result).toEqual({ allergens: ["milch"], complete: false });
  });

  it("behandelt eine ungeprüfte Zutat ohne Allergene nicht als allergenfrei", () => {
    expect(deriveAllergens([{ allergens: [], allergensChecked: false }])).toEqual({
      allergens: [],
      complete: false,
    });
  });

  it("nimmt Allergene ungeprüfter Zutaten mit auf", () => {
    expect(deriveAllergens([{ allergens: ["soja"], allergensChecked: false }]).allergens).toEqual(["soja"]);
  });

  it("liefert für geprüfte Zutaten ohne Allergene eine leere, vollständige Liste", () => {
    expect(deriveAllergens([{ allergens: [], allergensChecked: true }])).toEqual({
      allergens: [],
      complete: true,
    });
  });

  it("liefert ohne Zutaten eine leere, vollständige Liste", () => {
    expect(deriveAllergens([])).toEqual({ allergens: [], complete: true });
  });

  it("ignoriert unbekannte Schlüssel", () => {
    expect(deriveAllergens([{ allergens: ["milch", "foo"], allergensChecked: true }]).allergens).toEqual(["milch"]);
  });
});

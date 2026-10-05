import { describe, expect, it } from "vitest";
import { UNITS, isUnit, toBase, unitFamily } from "./units";

describe("UNITS", () => {
  it("enthält die zwölf Einheiten aus der SPEC", () => {
    expect(UNITS).toEqual(["g", "kg", "ml", "l", "St.", "Pckg.", "Dose", "Glas", "Bund", "EL", "TL", "Prise"]);
  });

  it("erkennt gültige Einheiten", () => {
    expect(isUnit("kg")).toBe(true);
    expect(isUnit("Schuss")).toBe(false);
  });
});

describe("unitFamily", () => {
  it("ordnet Einheiten ihrer Familie zu", () => {
    expect(unitFamily("g")).toBe("mass");
    expect(unitFamily("kg")).toBe("mass");
    expect(unitFamily("ml")).toBe("volume");
    expect(unitFamily("l")).toBe("volume");
    expect(unitFamily("St.")).toBe("count");
    expect(unitFamily("Bund")).toBe("count");
    expect(unitFamily("EL")).toBe("spoon");
    expect(unitFamily("Prise")).toBe("spoon");
  });

  it("behandelt leere und unbekannte Einheiten als other", () => {
    expect(unitFamily("")).toBe("other");
    expect(unitFamily(null)).toBe("other");
    expect(unitFamily("Schuss")).toBe("other");
  });
});

describe("toBase", () => {
  it("rechnet kg in g und l in ml", () => {
    expect(toBase(2.5, "kg")).toEqual({ amount: 2500, unit: "g" });
    expect(toBase(0.5, "l")).toEqual({ amount: 500, unit: "ml" });
  });

  it("lässt Basis- und Stückeinheiten, wie sie sind", () => {
    expect(toBase(300, "g")).toEqual({ amount: 300, unit: "g" });
    expect(toBase(3, "St.")).toEqual({ amount: 3, unit: "St." });
    expect(toBase(2, "EL")).toEqual({ amount: 2, unit: "EL" });
  });

  it("macht aus fehlender Einheit einen leeren String", () => {
    expect(toBase(3, null)).toEqual({ amount: 3, unit: "" });
    expect(toBase(3, undefined)).toEqual({ amount: 3, unit: "" });
  });
});

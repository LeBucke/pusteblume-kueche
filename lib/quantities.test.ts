import { describe, expect, it } from "vitest";
import { formatAmount, formatNumber, portions, scaleFactor } from "./quantities";

const FACTOR = 1.5;

describe("portions", () => {
  it("zählt Erwachsene mit dem Faktor", () => {
    expect(portions(20, 5, FACTOR)).toBe(27.5);
    expect(portions(2, 2, FACTOR)).toBe(5);
  });

  it("liefert 0 bei 0 Personen", () => {
    expect(portions(0, 0, FACTOR)).toBe(0);
  });
});

describe("scaleFactor", () => {
  it("rechnet Zielgruppe zu Grundmenge", () => {
    expect(scaleFactor({ children: 20, adults: 5 }, { children: 20, adults: 5 }, FACTOR)).toBe(1);
    expect(scaleFactor({ children: 20, adults: 5 }, { children: 18, adults: 5 }, FACTOR)).toBeCloseTo(25.5 / 27.5, 10);
  });

  it("liefert 0 bei 0 Personen im Ziel", () => {
    expect(scaleFactor({ children: 20, adults: 5 }, { children: 0, adults: 0 }, FACTOR)).toBe(0);
  });

  it("liefert 0, wenn die Grundmenge keine Portionen hat", () => {
    expect(scaleFactor({ children: 0, adults: 0 }, { children: 18, adults: 5 }, FACTOR)).toBe(0);
  });
});

describe("Beispiel Kartoffelgratin (6000 g für 20/5)", () => {
  const grams = 6000;
  const base = { children: 20, adults: 5 };

  it("ergibt für 18/5 rund 5,6 kg", () => {
    const factor = scaleFactor(base, { children: 18, adults: 5 }, FACTOR);
    expect(formatAmount(grams * factor, "g", "recipe")).toBe("5,6 kg");
  });

  it("ergibt für 2/2 in der Elternansicht 1,1 kg", () => {
    const factor = scaleFactor(base, { children: 2, adults: 2 }, FACTOR);
    expect(formatAmount(grams * factor, "g", "parents")).toBe("1,1 kg");
  });
});

describe("formatNumber", () => {
  it("nutzt das Komma und lässt Endnullen weg", () => {
    expect(formatNumber(1.5, 1)).toBe("1,5");
    expect(formatNumber(2, 1)).toBe("2");
    expect(formatNumber(10, 0)).toBe("10");
    expect(formatNumber(2.25, 2)).toBe("2,25");
  });
});

describe("formatAmount: Masse und Volumen", () => {
  it("rundet unter 100 auf ganze Zahlen", () => {
    expect(formatAmount(7.4, "g", "recipe")).toBe("7 g");
    expect(formatAmount(99.6, "ml", "recipe")).toBe("100 ml");
  });

  it("zeigt positive Mengen nie als 0", () => {
    expect(formatAmount(0.3, "g", "parents")).toBe("1 g");
  });

  it("rundet ab 100 auf Zehner", () => {
    expect(formatAmount(452, "g", "recipe")).toBe("450 g");
    expect(formatAmount(455, "ml", "recipe")).toBe("460 ml");
    expect(formatAmount(0.25, "l", "recipe")).toBe("250 ml");
  });

  it("zeigt ab 1000 kg und l mit einer Nachkommastelle", () => {
    expect(formatAmount(8500, "g", "shopping")).toBe("8,5 kg");
    expect(formatAmount(2, "kg", "shopping")).toBe("2,0 kg");
    expect(formatAmount(1500, "ml", "recipe")).toBe("1,5 l");
    expect(formatAmount(0.5, "kg", "recipe")).toBe("500 g");
  });

  it("rundet erst, dann wird umgerechnet", () => {
    expect(formatAmount(995, "g", "recipe")).toBe("1,0 kg");
    expect(formatAmount(1044, "g", "recipe")).toBe("1,0 kg");
    expect(formatAmount(1049, "g", "recipe")).toBe("1,1 kg");
  });
});

describe("formatAmount: Stückeinheiten", () => {
  it("rundet im Rezept auf halbe Stücke", () => {
    expect(formatAmount(2.3, "St.", "recipe")).toBe("2,5 St.");
    expect(formatAmount(2.2, "St.", "recipe")).toBe("2 St.");
    expect(formatAmount(3, "Dose", "recipe")).toBe("3 Dose");
  });

  it("rundet im Einkauf immer auf ganze Stücke auf", () => {
    expect(formatAmount(2.1, "St.", "shopping")).toBe("3 St.");
    expect(formatAmount(0.2, "Bund", "shopping")).toBe("1 Bund");
  });

  it("verschluckt im Einkauf keine Gleitkommafehler", () => {
    expect(formatAmount(3.0000000001, "St.", "shopping")).toBe("3 St.");
  });

  it("zeigt mindestens ein halbes Stück, nie 0", () => {
    expect(formatAmount(0.2, "St.", "parents")).toBe("0,5 St.");
    expect(formatAmount(0.05, "Pckg.", "parents")).toBe("0,5 Pckg.");
    expect(formatAmount(0.2, "Glas", "recipe")).toBe("0,5 Glas");
  });
});

describe("formatAmount: EL, TL, Prise", () => {
  it("nutzt eine Nachkommastelle", () => {
    expect(formatAmount(1.26, "EL", "recipe")).toBe("1,3 EL");
    expect(formatAmount(2, "TL", "recipe")).toBe("2 TL");
    expect(formatAmount(0.04, "Prise", "parents")).toBe("0,1 Prise");
  });
});

describe("formatAmount: Sonderfälle", () => {
  it("meldet fehlende Mengen als nach Bedarf", () => {
    expect(formatAmount(null, "g", "recipe")).toBe("nach Bedarf");
    expect(formatAmount(undefined, null, "shopping")).toBe("nach Bedarf");
  });

  it("zeigt 0 als 0", () => {
    expect(formatAmount(0, "g", "recipe")).toBe("0 g");
    expect(formatAmount(0, "St.", "parents")).toBe("0 St.");
  });

  it("zeigt Mengen ohne Einheit ohne Einheit", () => {
    expect(formatAmount(3, "", "recipe")).toBe("3");
    expect(formatAmount(2.5, null, "recipe")).toBe("2,5");
  });

  it("zeigt unbekannte Einheiten mit höchstens zwei Nachkommastellen", () => {
    expect(formatAmount(2.5, "Schuss", "recipe")).toBe("2,5 Schuss");
  });
});

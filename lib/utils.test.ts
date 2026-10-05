import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("fügt Klassen mit Leerzeichen zusammen", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("lässt leere und falsche Werte weg", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("liefert einen leeren String ohne Klassen", () => {
    expect(cn()).toBe("");
  });
});

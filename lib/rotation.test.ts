import { describe, expect, it } from "vitest";
import { applyRotation, templateIndexForWeek } from "./rotation";
import type { Rotation } from "./types";

describe("templateIndexForWeek", () => {
  it("beginnt beim Startmontag mit Position 0", () => {
    expect(templateIndexForWeek("2026-10-05", "2026-10-05", 3)).toBe(0);
    expect(templateIndexForWeek("2026-10-12", "2026-10-05", 3)).toBe(1);
    expect(templateIndexForWeek("2026-10-19", "2026-10-05", 3)).toBe(2);
  });

  it("wiederholt zyklisch", () => {
    expect(templateIndexForWeek("2026-10-26", "2026-10-05", 3)).toBe(0);
    expect(templateIndexForWeek("2026-11-02", "2026-10-05", 3)).toBe(1);
  });

  it("rechnet über den Jahreswechsel (91 Tage = 13 Wochen)", () => {
    expect(templateIndexForWeek("2027-01-04", "2026-10-05", 3)).toBe(1);
    expect(templateIndexForWeek("2027-01-04", "2026-12-28", 2)).toBe(1);
  });

  it("rechnet über die Zeitumstellung am 25.10.2026", () => {
    expect(templateIndexForWeek("2026-10-26", "2026-10-19", 5)).toBe(1);
    expect(templateIndexForWeek("2026-10-26", "2026-10-05", 4)).toBe(3);
  });

  it("liefert für Wochen vor dem Start eine positive Position", () => {
    expect(templateIndexForWeek("2026-09-28", "2026-10-05", 3)).toBe(2);
    expect(templateIndexForWeek("2026-09-21", "2026-10-05", 3)).toBe(1);
  });

  it("nutzt den Montag, wenn ein anderer Wochentag übergeben wird", () => {
    expect(templateIndexForWeek("2026-10-14", "2026-10-05", 3)).toBe(1);
  });

  it("liefert ohne Vorlagen keine Position", () => {
    expect(templateIndexForWeek("2026-10-05", "2026-10-05", 0)).toBeNull();
  });
});

describe("applyRotation", () => {
  const rotation: Rotation = {
    start: "2026-10-05",
    templates: [
      {
        id: "A",
        name: "Woche A",
        meals: [
          { weekday: 1, course: "hauptgang", recipeId: "r1" },
          { weekday: 1, course: "nachtisch", recipeId: "r4" },
          { weekday: 2, course: "hauptgang", recipeId: "r2" },
        ],
      },
      { id: "B", name: "Woche B", meals: [{ weekday: 1, course: "hauptgang", recipeId: "r3" }] },
    ],
  };

  it("füllt Gänge nach Wochenvorlage und Kalenderwoche", () => {
    const result = applyRotation({ from: "2026-10-05", to: "2026-10-13" }, rotation, {}, new Set());
    expect(result).toEqual([
      { date: "2026-10-05", course: "hauptgang", recipeId: "r1", templateId: "A" },
      { date: "2026-10-05", course: "nachtisch", recipeId: "r4", templateId: "A" },
      { date: "2026-10-06", course: "hauptgang", recipeId: "r2", templateId: "A" },
      { date: "2026-10-12", course: "hauptgang", recipeId: "r3", templateId: "B" },
    ]);
  });

  it("überschreibt keine belegten Gänge", () => {
    const result = applyRotation(
      { from: "2026-10-05", to: "2026-10-06" },
      rotation,
      { "2026-10-05": { hauptgang: "andere" } },
      new Set(),
    );
    expect(result.map((e) => `${e.date} ${e.course}`)).toEqual([
      "2026-10-05 nachtisch",
      "2026-10-06 hauptgang",
    ]);
  });

  it("lässt geschlossene Tage aus", () => {
    const result = applyRotation({ from: "2026-10-05", to: "2026-10-06" }, rotation, {}, new Set(["2026-10-05"]));
    expect(result.map((e) => e.date)).toEqual(["2026-10-06"]);
  });

  it("lässt Wochenenden aus und startet auch mitten in der Woche", () => {
    const result = applyRotation({ from: "2026-10-03", to: "2026-10-06" }, rotation, {}, new Set());
    expect(result.map((e) => e.date)).toEqual(["2026-10-05", "2026-10-05", "2026-10-06"]);
  });

  it("wechselt über den Jahreswechsel die Vorlage", () => {
    const wrap: Rotation = { ...rotation, start: "2026-12-21" };
    const result = applyRotation({ from: "2026-12-28", to: "2027-01-05" }, wrap, {}, new Set());
    expect(result.map((e) => `${e.date} ${e.templateId} ${e.recipeId}`)).toEqual([
      "2026-12-28 B r3",
      "2027-01-04 A r1",
      "2027-01-04 A r4",
      "2027-01-05 A r2",
    ]);
  });

  it("liefert nichts ohne Startmontag oder ohne Vorlagen", () => {
    const range = { from: "2026-10-05", to: "2026-10-09" };
    expect(applyRotation(range, { ...rotation, start: null }, {}, new Set())).toEqual([]);
    expect(applyRotation(range, { start: "2026-10-05", templates: [] }, {}, new Set())).toEqual([]);
  });

  it("liefert nichts bei umgekehrtem Zeitraum", () => {
    expect(applyRotation({ from: "2026-10-09", to: "2026-10-05" }, rotation, {}, new Set())).toEqual([]);
  });
});

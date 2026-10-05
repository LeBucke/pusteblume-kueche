import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  eachDay,
  formatLong,
  formatShort,
  isValidDate,
  isWeekend,
  mondayOf,
  todayBerlin,
  weekday,
  weekdayName,
  weekdaysOfWeek,
} from "./dates";

describe("addDays", () => {
  it("rechnet über Monats- und Jahresgrenzen", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("kennt Schaltjahre", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("ist von der Zeitumstellung unberührt (Ende Oktober 2026)", () => {
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDays("2026-10-19", 7)).toBe("2026-10-26");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
  });
});

describe("daysBetween", () => {
  it("zählt Tage, auch über die Zeitumstellung", () => {
    expect(daysBetween("2026-10-19", "2026-10-26")).toBe(7);
    expect(daysBetween("2026-10-05", "2027-01-04")).toBe(91);
  });

  it("ist negativ, wenn das Ziel früher liegt", () => {
    expect(daysBetween("2026-10-12", "2026-10-05")).toBe(-7);
  });
});

describe("weekday, mondayOf, isWeekend", () => {
  it("zählt Montag als 1 und Sonntag als 7", () => {
    expect(weekday("2026-10-05")).toBe(1);
    expect(weekday("2026-10-09")).toBe(5);
    expect(weekday("2026-10-25")).toBe(7);
  });

  it("findet den Montag, auch von einem Sonntag aus", () => {
    expect(mondayOf("2026-10-05")).toBe("2026-10-05");
    expect(mondayOf("2026-10-08")).toBe("2026-10-05");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19");
  });

  it("findet den Montag über den Jahreswechsel", () => {
    expect(mondayOf("2027-01-01")).toBe("2026-12-28");
  });

  it("erkennt Wochenenden", () => {
    expect(isWeekend("2026-10-09")).toBe(false);
    expect(isWeekend("2026-10-10")).toBe(true);
    expect(isWeekend("2026-10-11")).toBe(true);
    expect(isWeekend("2026-10-12")).toBe(false);
  });
});

describe("eachDay und weekdaysOfWeek", () => {
  it("liefert aufeinanderfolgende Tage", () => {
    expect(eachDay("2026-12-30", 4)).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
    expect(eachDay("2026-10-05", 0)).toEqual([]);
  });

  it("liefert Montag bis Freitag", () => {
    expect(weekdaysOfWeek("2026-10-07")).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
    ]);
  });
});

describe("deutsche Formate", () => {
  it("formatiert kurz und lang", () => {
    expect(formatShort("2026-10-12")).toBe("12.10.");
    expect(formatLong("2026-10-12")).toBe("12.10.2026");
  });

  it("nennt den Wochentag", () => {
    expect(weekdayName("2026-10-12")).toBe("Montag");
    expect(weekdayName("2026-10-17")).toBe("Samstag");
  });
});

describe("Validierung", () => {
  it("erkennt ungültige Daten", () => {
    expect(isValidDate("2026-10-05")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("5.10.2026")).toBe(false);
    expect(() => addDays("2026-13-01", 1)).toThrow();
  });
});

describe("todayBerlin", () => {
  it("nimmt das Datum in Berlin, nicht in UTC", () => {
    expect(todayBerlin(new Date("2026-10-04T22:30:00Z"))).toBe("2026-10-05");
    expect(todayBerlin(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
    expect(todayBerlin(new Date("2026-10-05T10:00:00Z"))).toBe("2026-10-05");
  });
});

import { describe, expect, it } from "vitest";
import { canAccess, homePath, navItemsFor, normalizeRoles } from "./roles";

const labels = (roles: Parameters<typeof navItemsFor>[0]) =>
  navItemsFor(roles).map((item) => item.label);

describe("homePath", () => {
  it("leitet jede Einzelrolle auf ihre Startseite", () => {
    expect(homePath(["planung"])).toBe("/plan");
    expect(homePath(["kueche"])).toBe("/heute");
    expect(homePath(["einkauf"])).toBe("/einkauf");
    expect(homePath(["admin"])).toBe("/admin");
  });

  it("nimmt bei mehreren Rollen die Reihenfolge planung, kueche, einkauf, admin", () => {
    expect(homePath(["admin", "planung"])).toBe("/plan");
    expect(homePath(["admin", "einkauf"])).toBe("/einkauf");
    expect(homePath(["einkauf", "kueche"])).toBe("/heute");
  });

  it("gibt ohne Rolle null zurück", () => {
    expect(homePath([])).toBeNull();
  });
});

describe("navItemsFor", () => {
  it("zeigt einkauf nur Heute, Speiseplan, Rezepte und Einkauf", () => {
    expect(labels(["einkauf"])).toEqual(["Heute", "Speiseplan", "Rezepte", "Einkauf"]);
  });

  it("zeigt kueche dasselbe wie einkauf", () => {
    expect(labels(["kueche"])).toEqual(["Heute", "Speiseplan", "Rezepte", "Einkauf"]);
  });

  it("zeigt planung zusätzlich Vorlagen, aber kein Admin", () => {
    expect(labels(["planung"])).toEqual([
      "Heute",
      "Speiseplan",
      "Rezepte",
      "Vorlagen",
      "Einkauf",
    ]);
  });

  it("zeigt admin alles", () => {
    expect(labels(["admin"])).toEqual([
      "Heute",
      "Speiseplan",
      "Rezepte",
      "Vorlagen",
      "Einkauf",
      "Admin",
    ]);
  });

  it("vereinigt mehrere Rollen", () => {
    expect(labels(["einkauf", "planung"])).toContain("Vorlagen");
    expect(labels(["einkauf", "planung"])).not.toContain("Admin");
  });

  it("zeigt ohne Rolle nichts", () => {
    expect(navItemsFor([])).toEqual([]);
  });
});

describe("canAccess", () => {
  it("erlaubt die offenen Bereiche allen Rollen", () => {
    for (const path of ["/heute", "/plan", "/plan/2026-10-05", "/rezepte", "/einkauf"]) {
      expect(canAccess(["einkauf"], path)).toBe(true);
      expect(canAccess(["kueche"], path)).toBe(true);
    }
  });

  it("sperrt Vorlagen und Zutaten für kueche und einkauf", () => {
    expect(canAccess(["kueche"], "/vorlagen")).toBe(false);
    expect(canAccess(["einkauf"], "/zutaten")).toBe(false);
    expect(canAccess(["planung"], "/vorlagen")).toBe(true);
    expect(canAccess(["admin"], "/zutaten")).toBe(true);
  });

  it("sperrt Admin für alle außer admin, auch Unterseiten", () => {
    expect(canAccess(["planung"], "/admin")).toBe(false);
    expect(canAccess(["planung"], "/admin/nutzer")).toBe(false);
    expect(canAccess(["admin"], "/admin/nutzer")).toBe(true);
  });

  it("verwechselt Präfixe nicht", () => {
    expect(canAccess(["einkauf"], "/adminfoo")).toBe(true);
  });

  it("sperrt ohne Rolle alles", () => {
    expect(canAccess([], "/heute")).toBe(false);
  });
});

describe("normalizeRoles", () => {
  it("behält nur bekannte Rollen in fester Reihenfolge", () => {
    expect(normalizeRoles(["einkauf", "chef", "admin", "einkauf"])).toEqual([
      "admin",
      "einkauf",
    ]);
    expect(normalizeRoles(null)).toEqual([]);
  });
});

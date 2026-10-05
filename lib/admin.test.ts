import { describe, expect, it } from "vitest";
import {
  inviteSchema,
  leavesNoActiveAdmin,
  moveItem,
  productGroupSchema,
  rolesSchema,
  settingsSchema,
  supplierSchema,
  type ProfileLike,
} from "./admin";

const UUID = "3f2b8c1e-5a4d-4e6f-8a7b-9c0d1e2f3a4b";

describe("inviteSchema", () => {
  it("nimmt gültige Eingaben an, kürzt Leerzeichen und ordnet die Rollen", () => {
    const result = inviteSchema.parse({
      displayName: "  Anna Beispiel ",
      email: " anna@example.de ",
      roles: ["einkauf", "admin"],
    });
    expect(result).toEqual({
      displayName: "Anna Beispiel",
      email: "anna@example.de",
      roles: ["admin", "einkauf"],
    });
  });

  it("verlangt Name, gültige Mail und mindestens eine bekannte Rolle", () => {
    const base = { displayName: "Anna", email: "anna@example.de", roles: ["kueche"] };
    expect(inviteSchema.safeParse({ ...base, displayName: "  " }).error?.issues[0].message).toBe(
      "Bitte gib einen Namen ein.",
    );
    expect(inviteSchema.safeParse({ ...base, email: "anna" }).error?.issues[0].message).toBe(
      "Bitte gib eine gültige Mailadresse ein.",
    );
    expect(inviteSchema.safeParse({ ...base, roles: [] }).error?.issues[0].message).toBe(
      "Bitte wähle mindestens eine Rolle.",
    );
    expect(inviteSchema.safeParse({ ...base, roles: ["chef"] }).error?.issues[0].message).toBe(
      "Unbekannte Rolle.",
    );
  });
});

describe("rolesSchema", () => {
  it("braucht eine Nutzer-ID und Rollen", () => {
    expect(rolesSchema.safeParse({ userId: UUID, roles: ["planung"] }).success).toBe(true);
    expect(rolesSchema.safeParse({ userId: "x", roles: ["planung"] }).success).toBe(false);
    expect(rolesSchema.safeParse({ userId: UUID, roles: [] }).success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("versteht das Komma beim Erwachsenenfaktor", () => {
    const result = settingsSchema.parse({
      defaultChildren: "20",
      defaultAdults: "5",
      adultFactor: "1,5",
    });
    expect(result).toEqual({ defaultChildren: 20, defaultAdults: 5, adultFactor: 1.5 });
  });

  it("lehnt Unsinn mit deutschen Meldungen ab", () => {
    const base = { defaultChildren: "20", defaultAdults: "5", adultFactor: "1,5" };
    const message = (patch: object) =>
      settingsSchema.safeParse({ ...base, ...patch }).error?.issues[0].message;
    expect(message({ defaultChildren: "" })).toBe("Kinder: Bitte gib eine ganze Zahl ein.");
    expect(message({ defaultChildren: "2,5" })).toBe("Kinder: Bitte gib eine ganze Zahl ein.");
    expect(message({ defaultAdults: "-1" })).toBe("Erwachsene darf nicht negativ sein.");
    expect(message({ adultFactor: "0" })).toBe("Der Erwachsenenfaktor muss größer als 0 sein.");
    expect(message({ adultFactor: "viel" })).toBe(
      "Erwachsenenfaktor: Bitte gib eine Zahl ein, z. B. 1,5.",
    );
  });
});

describe("supplierSchema", () => {
  it("macht leere Felder zu null", () => {
    expect(supplierSchema.parse({ name: " Biobauer ", contact: "", notes: "  " })).toEqual({
      name: "Biobauer",
      contact: null,
      notes: null,
    });
  });

  it("verlangt einen Namen", () => {
    expect(supplierSchema.safeParse({ name: "", contact: "", notes: "" }).success).toBe(false);
  });
});

describe("productGroupSchema", () => {
  it("erlaubt eine Warengruppe ohne Standardlieferant", () => {
    expect(productGroupSchema.parse({ name: "Gemüse", defaultSupplierId: "" })).toEqual({
      name: "Gemüse",
      defaultSupplierId: null,
    });
  });

  it("prüft die Lieferanten-ID", () => {
    expect(productGroupSchema.parse({ name: "Obst", defaultSupplierId: UUID }).defaultSupplierId).toBe(
      UUID,
    );
    expect(productGroupSchema.safeParse({ name: "Obst", defaultSupplierId: "abc" }).success).toBe(
      false,
    );
  });
});

describe("leavesNoActiveAdmin", () => {
  const admin: ProfileLike = { id: "a", roles: ["admin", "planung"], active: true };
  const other: ProfileLike = { id: "b", roles: ["einkauf"], active: true };

  it("blockiert, wenn der einzige aktive Admin die Rolle verliert oder deaktiviert wird", () => {
    expect(leavesNoActiveAdmin([admin, other], "a", { roles: ["planung"] })).toBe(true);
    expect(leavesNoActiveAdmin([admin, other], "a", { active: false })).toBe(true);
  });

  it("erlaubt es, solange noch ein anderer aktiver Admin da ist", () => {
    const second: ProfileLike = { id: "c", roles: ["admin"], active: true };
    expect(leavesNoActiveAdmin([admin, second], "a", { active: false })).toBe(false);
  });

  it("zählt einen deaktivierten Admin nicht mit", () => {
    const inactive: ProfileLike = { id: "c", roles: ["admin"], active: false };
    expect(leavesNoActiveAdmin([admin, inactive], "a", { roles: ["kueche"] })).toBe(true);
  });

  it("blockiert nichts, wenn die Rolle Admin bleibt oder die Person kein aktiver Admin ist", () => {
    expect(leavesNoActiveAdmin([admin, other], "a", { roles: ["admin"] })).toBe(false);
    expect(leavesNoActiveAdmin([admin, other], "b", { roles: ["kueche"] })).toBe(false);
    expect(leavesNoActiveAdmin([admin, other], "unbekannt", { active: false })).toBe(false);
  });
});

describe("moveItem", () => {
  const ids = ["a", "b", "c"];

  it("verschiebt um einen Platz", () => {
    expect(moveItem(ids, "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveItem(ids, "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("lässt die Reihenfolge am Rand oder bei unbekannter ID unverändert", () => {
    expect(moveItem(ids, "a", "up")).toEqual(ids);
    expect(moveItem(ids, "c", "down")).toEqual(ids);
    expect(moveItem(ids, "x", "up")).toEqual(ids);
  });

  it("verändert die Eingabe nicht", () => {
    moveItem(ids, "b", "up");
    expect(ids).toEqual(["a", "b", "c"]);
  });
});

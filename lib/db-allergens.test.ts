import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ALLERGENS } from "./allergens";

describe("Allergen Schlüssel in der Datenbank", () => {
  it("stimmen mit lib/allergens.ts überein", () => {
    const sql = readFileSync("supabase/migrations/20261005100000_schema.sql", "utf8");
    const body = /create function public\.allergens_valid[\s\S]*?array\[([\s\S]*?)\]::text\[\]/.exec(sql);
    expect(body).not.toBeNull();
    const keys = [...body![1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(keys.sort()).toEqual(ALLERGENS.map((a) => a.key).sort());
  });
});

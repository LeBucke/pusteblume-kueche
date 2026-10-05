/**
 * Test von merge_ingredients (Paket 05) gegen das verknüpfte Supabase Projekt (npm run test:rls).
 *
 * Testnutzer je Rolle, Testdaten mit Präfix `__mrg_` und Mail `mrg-test-…@example.test` (anderes Präfix als rls.test.ts, dessen Aufräumen läuft parallel), danach Aufräumen.
 * Geprüft wird: Rezeptverweise wandern auf die Zielzutat, die Quelle wird archiviert, Name und Synonyme
 * der Quelle bleiben beim Ziel auffindbar, und wer nicht planung oder admin ist, ändert nichts.
 */
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY und SUPABASE_SERVICE_ROLE_KEY fehlen in .env.local.");
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(url, serviceKey, noSession);
const runId = randomUUID().slice(0, 8);
const password = randomUUID() + randomUUID();
let counter = 0;
const nextTag = () => `__mrg_${runId}_${counter++}`;

const ROLES = ["admin", "planung", "kueche", "einkauf"] as const;
type Role = (typeof ROLES)[number] | "anon";
const clients = {} as Record<Role, SupabaseClient>;
const userIds: string[] = [];
const recipeIds: string[] = [];
const ingredientIds: string[] = [];

async function newIngredient(values: Record<string, unknown> = {}) {
  const { data, error } = await service
    .from("ingredients")
    .insert({ name: nextTag(), ...values })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message);
  ingredientIds.push(data.id);
  return data;
}

async function newRecipe() {
  const { data, error } = await service
    .from("recipes")
    .insert({ name: nextTag(), course: "hauptgang" })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message);
  recipeIds.push(data.id);
  return data;
}

async function use(recipeId: string, ingredientId: string, sort = 0) {
  const { error } = await service
    .from("recipe_ingredients")
    .insert({ recipe_id: recipeId, ingredient_id: ingredientId, amount: 100, unit: "g", sort });
  if (error) throw new Error(error.message);
}

async function usedBy(ingredientId: string): Promise<string[]> {
  const { data } = await service.from("recipe_ingredients").select("recipe_id").eq("ingredient_id", ingredientId);
  return (data ?? []).map((row) => row.recipe_id).sort();
}

async function purge() {
  await service.from("recipes").delete().like("name", "\\_\\_mrg\\_%");
  await service.from("ingredients").delete().like("name", "\\_\\_mrg\\_%");
  for (let page = 1; ; page++) {
    const { data } = await service.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email?.startsWith(`mrg-test-`) && u.email.endsWith("@example.test")) {
        await service.auth.admin.deleteUser(u.id);
      }
    }
    if (users.length < 200) break;
  }
}

beforeAll(async () => {
  await purge();
  for (const role of ROLES) {
    const email = `mrg-test-${runId}-${role}@example.test`;
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new Error(`Nutzer ${role}: ${error?.message}`);
    userIds.push(data.user.id);
    const { error: roleError } = await service.from("profiles").update({ roles: [role] }).eq("id", data.user.id);
    if (roleError) throw new Error(roleError.message);
    const client = createClient(url, anonKey, noSession);
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(`Anmeldung ${role}: ${signInError.message}`);
    clients[role] = client;
  }
  clients.anon = createClient(url, anonKey, noSession);
});

afterAll(async () => {
  await service.from("recipes").delete().in("id", recipeIds);
  await service.from("ingredients").delete().in("id", ingredientIds);
  for (const id of userIds) await service.auth.admin.deleteUser(id);
});

describe.each(["planung", "admin"] as const)("merge_ingredients als %s", (role) => {
  it("hängt alle Rezeptverweise um, archiviert die Quelle und behält Namen als Synonyme", async () => {
    const target = await newIngredient({ aliases: ["Zielsynonym"], allergens: ["sellerie"], allergens_checked: true });
    const source = await newIngredient({ aliases: ["Quellsynonym", "Zielsynonym"], allergens: ["milch"] });
    const other = await newIngredient();
    const recipeA = await newRecipe();
    const recipeB = await newRecipe();
    const recipeC = await newRecipe();
    await use(recipeA.id, source.id);
    await use(recipeB.id, source.id);
    await use(recipeB.id, source.id, 1); // zweimal im selben Rezept zählt als ein Rezept
    await use(recipeC.id, other.id);
    await use(recipeC.id, target.id, 1);

    const { data, error } = await clients[role].rpc("merge_ingredients", {
      source_id: source.id,
      target_id: target.id,
    });
    expect(error).toBeNull();
    expect(data).toBe(2);

    expect(await usedBy(source.id)).toEqual([]);
    expect(await usedBy(target.id)).toEqual([recipeA.id, recipeB.id, recipeB.id, recipeC.id].sort());
    expect(await usedBy(other.id)).toEqual([recipeC.id]);

    const { data: after } = await service.from("ingredients").select("*").in("id", [source.id, target.id]);
    const afterSource = after!.find((i) => i.id === source.id)!;
    const afterTarget = after!.find((i) => i.id === target.id)!;
    expect(afterSource.archived).toBe(true);
    expect(afterTarget.archived).toBe(false);
    expect(afterTarget.aliases).toEqual(["Zielsynonym", source.name, "Quellsynonym"]);
    // Allergene und Prüfstatus des Ziels bleiben unverändert.
    expect(afterTarget.allergens).toEqual(["sellerie"]);
    expect(afterTarget.allergens_checked).toBe(true);
  });

  it("lässt den Namen des Ziels nicht als eigenes Synonym stehen", async () => {
    const target = await newIngredient();
    const source = await newIngredient({ aliases: [target.name.toUpperCase()] });
    const { error } = await clients[role].rpc("merge_ingredients", { source_id: source.id, target_id: target.id });
    expect(error).toBeNull();
    const { data } = await service.from("ingredients").select("aliases").eq("id", target.id).single();
    expect(data!.aliases).toEqual([source.name]);
  });

  it("verweigert gleiche Zutaten und fehlende Zutaten", async () => {
    const ingredient = await newIngredient();
    const same = await clients[role].rpc("merge_ingredients", { source_id: ingredient.id, target_id: ingredient.id });
    expect(same.error?.code).toBe("22023");
    const missing = await clients[role].rpc("merge_ingredients", { source_id: ingredient.id, target_id: randomUUID() });
    expect(missing.error?.code).toBe("P0002");
    const { data } = await service.from("ingredients").select("archived").eq("id", ingredient.id).single();
    expect(data!.archived).toBe(false);
  });
});

describe.each(["kueche", "einkauf", "anon"] as const)("merge_ingredients als %s", (role) => {
  it("ändert nichts", async () => {
    const target = await newIngredient();
    const source = await newIngredient();
    const recipe = await newRecipe();
    await use(recipe.id, source.id);

    const { error } = await clients[role].rpc("merge_ingredients", { source_id: source.id, target_id: target.id });
    expect(error).not.toBeNull();

    expect(await usedBy(source.id)).toEqual([recipe.id]);
    expect(await usedBy(target.id)).toEqual([]);
    const { data } = await service.from("ingredients").select("archived, aliases").eq("id", source.id).single();
    expect(data!.archived).toBe(false);
  });
});

describe("neue Zutaten", () => {
  it("starten mit ungeprüften Allergenen und ohne Allergene", async () => {
    const ingredient = await newIngredient();
    expect(ingredient.allergens_checked).toBe(false);
    expect(ingredient.allergens).toEqual([]);
  });
});

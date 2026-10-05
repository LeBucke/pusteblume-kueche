/**
 * Test von save_recipe (Paket 06) gegen das verknüpfte Supabase Projekt (npm run test:rls).
 *
 * Testnutzer je Rolle, Testdaten mit Präfix `__rcp_` und Mail `rcp-test-…@example.test` (eigenes Präfix,
 * weil das Aufräumen in den anderen Testdateien parallel läuft), danach Aufräumen.
 * Geprüft wird: Anlegen und Ändern in einer Transaktion samt Reihenfolge der Zutatenzeilen, ein Fehler
 * mittendrin lässt das alte Rezept unverändert, und wer nicht planung oder admin ist, ändert nichts.
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
const nextTag = () => `__rcp_${runId}_${counter++}`;

const ROLES = ["admin", "planung", "kueche", "einkauf"] as const;
type Role = (typeof ROLES)[number] | "anon";
const clients = {} as Record<Role, SupabaseClient>;
const userIds: string[] = [];
const recipeIds: string[] = [];
const ingredientIds: string[] = [];

async function newIngredient() {
  const { data, error } = await service.from("ingredients").insert({ name: nextTag() }).select().single();
  if (error || !data) throw new Error(error?.message);
  ingredientIds.push(data.id);
  return data;
}

const recipeJson = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  course: "hauptgang",
  category: "Auflauf",
  base_children: 20,
  base_adults: 5,
  description: null,
  author: "Test",
  steps: "Eins\nZwei",
  notes: null,
  ...extra,
});

async function linesOf(recipeId: string) {
  const { data } = await service
    .from("recipe_ingredients")
    .select("ingredient_id, amount, unit, note, sort")
    .eq("recipe_id", recipeId)
    .order("sort");
  return data ?? [];
}

async function purge() {
  await service.from("recipes").delete().like("name", "\\_\\_rcp\\_%");
  await service.from("ingredients").delete().like("name", "\\_\\_rcp\\_%");
  for (let page = 1; ; page++) {
    const { data } = await service.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email?.startsWith("rcp-test-") && u.email.endsWith("@example.test")) {
        await service.auth.admin.deleteUser(u.id);
      }
    }
    if (users.length < 200) break;
  }
}

beforeAll(async () => {
  await purge();
  for (const role of ROLES) {
    const email = `rcp-test-${runId}-${role}@example.test`;
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

describe.each(["planung", "admin"] as const)("save_recipe als %s", (role) => {
  it("legt ein Rezept mit Zutatenzeilen in der angegebenen Reihenfolge an", async () => {
    const a = await newIngredient();
    const b = await newIngredient();
    const name = nextTag();

    const { data: id, error } = await clients[role].rpc("save_recipe", {
      p_id: null as unknown as string,
      p_recipe: recipeJson(name),
      p_lines: [
        { ingredient_id: b.id, amount: 1.5, unit: "kg", note: "gewürfelt" },
        { ingredient_id: a.id, amount: null, unit: null, note: null },
      ],
    });
    expect(error).toBeNull();
    expect(typeof id).toBe("string");
    recipeIds.push(id as string);

    const { data: recipe } = await service.from("recipes").select("*").eq("id", id as string).single();
    expect(recipe).toMatchObject({ name, course: "hauptgang", category: "Auflauf", base_children: 20, base_adults: 5 });
    expect(recipe!.description).toBeNull();
    expect(recipe!.steps).toBe("Eins\nZwei");

    expect(await linesOf(id as string)).toEqual([
      { ingredient_id: b.id, amount: 1.5, unit: "kg", note: "gewürfelt", sort: 0 },
      { ingredient_id: a.id, amount: null, unit: null, note: null, sort: 1 },
    ]);
  });

  it("ersetzt beim Ändern die Zeilen und lässt das Rezept dieselbe ID behalten", async () => {
    const a = await newIngredient();
    const b = await newIngredient();
    const first = await clients[role].rpc("save_recipe", {
      p_id: null as unknown as string,
      p_recipe: recipeJson(nextTag()),
      p_lines: [{ ingredient_id: a.id, amount: 100, unit: "g", note: null }],
    });
    const id = first.data as string;
    recipeIds.push(id);

    const newName = nextTag();
    const { data: sameId, error } = await clients[role].rpc("save_recipe", {
      p_id: id,
      p_recipe: recipeJson(newName, { course: "nachtisch", category: "" }),
      p_lines: [{ ingredient_id: b.id, amount: 2, unit: "St.", note: null }],
    });
    expect(error).toBeNull();
    expect(sameId).toBe(id);

    const { data: recipe } = await service.from("recipes").select("name, course, category").eq("id", id).single();
    expect(recipe).toEqual({ name: newName, course: "nachtisch", category: null });
    expect(await linesOf(id)).toEqual([{ ingredient_id: b.id, amount: 2, unit: "St.", note: null, sort: 0 }]);
  });

  it("lässt bei einem Fehler das alte Rezept samt Zeilen unverändert", async () => {
    const a = await newIngredient();
    const name = nextTag();
    const first = await clients[role].rpc("save_recipe", {
      p_id: null as unknown as string,
      p_recipe: recipeJson(name),
      p_lines: [{ ingredient_id: a.id, amount: 100, unit: "g", note: null }],
    });
    const id = first.data as string;
    recipeIds.push(id);

    // Unbekannte Zutat: Der Fremdschlüssel scheitert nach dem Update und nach dem Löschen der alten Zeilen.
    const { error } = await clients[role].rpc("save_recipe", {
      p_id: id,
      p_recipe: recipeJson(nextTag()),
      p_lines: [{ ingredient_id: randomUUID(), amount: 1, unit: "g", note: null }],
    });
    expect(error).not.toBeNull();

    const { data: recipe } = await service.from("recipes").select("name").eq("id", id).single();
    expect(recipe!.name).toBe(name);
    expect(await linesOf(id)).toHaveLength(1);
  });

  it("meldet ein unbekanntes Rezept und legt dabei nichts an", async () => {
    const { error } = await clients[role].rpc("save_recipe", {
      p_id: randomUUID(),
      p_recipe: recipeJson(nextTag()),
      p_lines: [],
    });
    expect(error?.code).toBe("P0002");
  });
});

describe.each(["kueche", "einkauf", "anon"] as const)("save_recipe als %s", (role) => {
  it("legt nichts an und ändert nichts", async () => {
    const a = await newIngredient();
    const name = nextTag();
    const created = await service
      .from("recipes")
      .insert({ name, course: "hauptgang" })
      .select()
      .single();
    recipeIds.push(created.data!.id);
    await service
      .from("recipe_ingredients")
      .insert({ recipe_id: created.data!.id, ingredient_id: a.id, amount: 1, unit: "g", sort: 0 });

    const change = await clients[role].rpc("save_recipe", {
      p_id: created.data!.id,
      p_recipe: recipeJson(nextTag()),
      p_lines: [],
    });
    expect(change.error).not.toBeNull();

    const attempt = nextTag();
    const create = await clients[role].rpc("save_recipe", {
      p_id: null as unknown as string,
      p_recipe: recipeJson(attempt),
      p_lines: [],
    });
    expect(create.error).not.toBeNull();

    const { data: recipe } = await service.from("recipes").select("name").eq("id", created.data!.id).single();
    expect(recipe!.name).toBe(name);
    expect(await linesOf(created.data!.id)).toHaveLength(1);
    const { data: leaked } = await service.from("recipes").select("id").eq("name", attempt);
    expect(leaked).toEqual([]);
  });
});

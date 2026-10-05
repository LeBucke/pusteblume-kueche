/**
 * RLS Tests gegen das verknüpfte Supabase Projekt (npm run test:rls).
 *
 * Legt Testnutzer je Rolle und Testzeilen an (Präfix `__rls_`, Mail `rls-test-…@example.test`,
 * Daten ab dem Jahr 2100) und räumt danach auf. Die Erwartungen sind hier von Hand nach der
 * Tabelle in SPEC 5 geschrieben und werden nicht aus den Migrationen abgeleitet.
 * Die Rollenvergabe des Profil Triggers prüft supabase/tests/profile_trigger.sql.
 */
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zeilen kommen untypisiert aus der Datenbank
type Row = Record<string, any>;
type Cleanup = () => Promise<unknown>;
type Actor = "admin" | "planung" | "kueche" | "einkauf" | "ohne_rolle" | "deaktiviert" | "anon";

const ACTORS: Actor[] = ["admin", "planung", "kueche", "einkauf", "ohne_rolle", "deaktiviert", "anon"];
const READERS: Actor[] = ["admin", "planung", "kueche", "einkauf", "ohne_rolle"];

const ADMIN: Actor[] = ["admin"];
const PLANUNG: Actor[] = ["admin", "planung"];
const EINKAUF: Actor[] = ["admin", "planung", "einkauf"];
const KUECHE: Actor[] = ["admin", "planung", "kueche"];
const NIEMAND: Actor[] = [];

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
const nextTag = () => `__rls_${runId}_${counter++}`;

/** Eindeutige Tage ab 2100, damit keine echten Plandaten berührt werden. */
function uniqueDate(): string {
  const n = counter++;
  const year = 2100 + Math.floor(n / 336);
  const month = 1 + Math.floor((n % 336) / 28);
  const day = 1 + (n % 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const uniquePosition = () => 1_000_000 + counter++;

type DbResult = PromiseLike<{ data: unknown; error: { message: string } | null }>;

async function must(result: DbResult): Promise<Row> {
  const { data, error } = await result;
  if (error || data === null) throw new Error(error?.message ?? "keine Daten");
  return data as Row;
}

async function mustList(result: DbResult): Promise<Row[]> {
  return (await must(result)) as unknown as Row[];
}

async function runCleanups(cleanups: Cleanup[]) {
  for (const fn of cleanups.reverse()) {
    try {
      await fn();
    } catch {
      /* Aufräumen ist best effort, beim nächsten Lauf räumt purgeLeftovers nach */
    }
  }
}

function keyOf(row: Row, pk: string[]): Row {
  return Object.fromEntries(pk.map((k) => [k, row[k]]));
}

// ---------------------------------------------------------------------------
// Testnutzer
// ---------------------------------------------------------------------------

const clients = {} as Record<Actor, SupabaseClient>;
const userIds = {} as Record<Actor, string>;
const globalCleanups: Cleanup[] = [];

async function createTestUser(
  label: string,
  options: { app_metadata?: Row; user_metadata?: Row } = {},
): Promise<{ id: string; email: string }> {
  const email = `rls-test-${runId}-${label}@example.test`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: options.app_metadata,
    user_metadata: options.user_metadata,
  });
  if (error || !data.user) throw new Error(`Nutzer ${label}: ${error?.message}`);
  return { id: data.user.id, email };
}

async function deleteUserLater(id: string, cleanups: Cleanup[]) {
  cleanups.push(async () => {
    await service.auth.admin.deleteUser(id);
  });
}

async function purgeLeftovers() {
  // Reste abgebrochener Läufe, Reihenfolge wegen Fremdschlüsseln.
  await service.from("plan_meals").delete().gte("date", "2100-01-01");
  await service.from("plan_days").delete().gte("date", "2100-01-01");
  await service.from("kitchen_feedback").delete().gte("date", "2100-01-01");
  await service.from("shopping_lists").delete().gte("start_date", "2100-01-01");
  await service.from("rotation_entries").delete().gte("position", 1_000_000);
  await service.from("week_templates").delete().like("name", "\\_\\_rls\\_%");
  await service.from("recipes").delete().like("name", "\\_\\_rls\\_%");
  await service.from("ingredients").delete().like("name", "\\_\\_rls\\_%");
  await service.from("product_groups").delete().like("name", "\\_\\_rls\\_%");
  await service.from("suppliers").delete().like("name", "\\_\\_rls\\_%");
  for (let page = 1; ; page++) {
    const { data } = await service.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email?.startsWith("rls-test-") && u.email.endsWith("@example.test")) {
        await service.auth.admin.deleteUser(u.id);
      }
    }
    if (users.length < 200) break;
  }
}

// ---------------------------------------------------------------------------
// Tabellen: erlaubte Rollen nach SPEC 5, Testzeilen und Änderung
// ---------------------------------------------------------------------------

interface Base {
  supplierId: string;
  recipeId: string;
  ingredientId: string;
  templateId: string;
  listId: string;
}
let base: Base;

interface TableSpec {
  pk: string[];
  insert: Actor[];
  update: Actor[];
  delete: Actor[];
  /** Zeile, die der Client einzufügen versucht (Fremdschlüssel gültig, Schlüssel eindeutig). */
  payload: (cleanups: Cleanup[]) => Promise<Row>;
  /** Zeile, die per Service Role angelegt wird, damit Lesen, Ändern, Löschen geprüft werden kann. */
  fixture?: (cleanups: Cleanup[]) => Promise<Row>;
  patch: Row;
}

function writers(who: Actor[]) {
  return { insert: who, update: who, delete: who };
}

const tables: Record<string, TableSpec> = {
  profiles: {
    pk: ["id"],
    insert: NIEMAND,
    update: ADMIN,
    delete: NIEMAND,
    payload: async () => ({ id: randomUUID(), display_name: "rls" }),
    fixture: async (cleanups) => {
      const user = await createTestUser(nextTag().slice(-12));
      await deleteUserLater(user.id, cleanups);
      return must(service.from("profiles").select().eq("id", user.id).single());
    },
    patch: { display_name: "rls geändert" },
  },
  settings: {
    pk: ["id"],
    insert: NIEMAND,
    update: ADMIN,
    delete: NIEMAND,
    payload: async () => ({ id: 2 }),
    fixture: async () => must(service.from("settings").select().eq("id", 1).single()),
    patch: { default_children: 20 },
  },
  suppliers: {
    pk: ["id"],
    ...writers(ADMIN),
    payload: async () => ({ name: nextTag() }),
    patch: { notes: "rls" },
  },
  product_groups: {
    pk: ["id"],
    ...writers(ADMIN),
    payload: async () => ({ name: nextTag() }),
    patch: { sort: 99 },
  },
  ingredients: {
    pk: ["id"],
    ...writers(PLANUNG),
    payload: async () => ({ name: nextTag() }),
    patch: { notes: "rls" },
  },
  recipes: {
    pk: ["id"],
    ...writers(PLANUNG),
    payload: async () => ({ name: nextTag(), course: "hauptgang" }),
    patch: { notes: "rls" },
  },
  recipe_ingredients: {
    pk: ["id"],
    ...writers(PLANUNG),
    payload: async () => ({ recipe_id: base.recipeId, ingredient_id: base.ingredientId }),
    patch: { note: "rls" },
  },
  plan_days: {
    pk: ["date"],
    ...writers(PLANUNG),
    payload: async () => ({ date: uniqueDate() }),
    patch: { note_internal: "rls" },
  },
  plan_meals: {
    pk: ["date", "course"],
    ...writers(PLANUNG),
    payload: async () => ({ date: uniqueDate(), course: "hauptgang", recipe_id: base.recipeId }),
    get patch() {
      return { recipe_id: base.recipeId };
    },
  },
  week_templates: {
    pk: ["id"],
    ...writers(PLANUNG),
    payload: async () => ({ name: nextTag() }),
    patch: { notes: "rls" },
  },
  week_template_meals: {
    pk: ["template_id", "weekday", "course"],
    ...writers(PLANUNG),
    payload: async (cleanups) => {
      const template = await must(service.from("week_templates").insert({ name: nextTag() }).select().single());
      cleanups.push(async () => {
        await service.from("week_templates").delete().eq("id", template.id);
      });
      return { template_id: template.id, weekday: 1, course: "hauptgang", recipe_id: base.recipeId };
    },
    get patch() {
      return { recipe_id: base.recipeId };
    },
  },
  rotation_entries: {
    pk: ["position"],
    ...writers(PLANUNG),
    payload: async () => ({ position: uniquePosition(), template_id: base.templateId }),
    get patch() {
      return { template_id: base.templateId };
    },
  },
  shopping_lists: {
    pk: ["id"],
    ...writers(EINKAUF),
    payload: async () => ({ start_date: uniqueDate(), days: 7 }),
    patch: { days: 6 },
  },
  shopping_checks: {
    pk: ["list_id", "item_key"],
    ...writers(EINKAUF),
    payload: async () => ({ list_id: base.listId, item_key: nextTag(), checked: true }),
    patch: { checked: false },
  },
  shopping_extras: {
    pk: ["id"],
    ...writers(EINKAUF),
    payload: async () => ({ list_id: base.listId, text: nextTag() }),
    patch: { done: true },
  },
  kitchen_feedback: {
    pk: ["date", "course"],
    ...writers(KUECHE),
    payload: async () => ({ date: uniqueDate(), course: "hauptgang", liked: "ja" }),
    patch: { note: "rls" },
  },
};

/** Legt eine Zeile per Service Role an und merkt sich das Aufräumen. */
async function makeFixture(table: string, spec: TableSpec, cleanups: Cleanup[]): Promise<Row> {
  if (spec.fixture) return spec.fixture(cleanups);
  const row = await must(service.from(table).insert(await spec.payload(cleanups)).select().single());
  const key = keyOf(row, spec.pk);
  cleanups.push(async () => {
    await service.from(table).delete().match(key);
  });
  return row;
}

const affected = (r: { error: unknown; data: unknown[] | null }) => !r.error && (r.data?.length ?? 0) === 1;

// ---------------------------------------------------------------------------
// Aufbau und Abbau
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await purgeLeftovers();

  const roleUsers: Record<string, string[]> = {
    admin: ["admin"],
    planung: ["planung"],
    kueche: ["kueche"],
    einkauf: ["einkauf"],
    ohne_rolle: [],
    deaktiviert: ["admin"],
  };
  for (const [actor, roles] of Object.entries(roleUsers)) {
    const user = await createTestUser(actor);
    await deleteUserLater(user.id, globalCleanups);
    userIds[actor as Actor] = user.id;
    // Rollen setzt der Admin (später die Server Action nach der Einladung) auf dem Profil.
    await must(
      service
        .from("profiles")
        .update({ roles, active: actor !== "deaktiviert" })
        .eq("id", user.id)
        .select(),
    );
    const client = createClient(url, anonKey, noSession);
    const { error } = await client.auth.signInWithPassword({ email: user.email, password });
    if (error) throw new Error(`Anmeldung ${actor}: ${error.message}`);
    clients[actor as Actor] = client;
  }
  clients.anon = createClient(url, anonKey, noSession);

  const supplier = await must(service.from("suppliers").select().eq("name", "Bio-Bauer").single());
  const recipe = await must(service.from("recipes").insert({ name: nextTag(), course: "hauptgang" }).select().single());
  globalCleanups.push(async () => {
    await service.from("recipes").delete().eq("id", recipe.id);
  });
  const ingredient = await must(service.from("ingredients").insert({ name: nextTag() }).select().single());
  globalCleanups.push(async () => {
    await service.from("ingredients").delete().eq("id", ingredient.id);
  });
  const template = await must(service.from("week_templates").insert({ name: nextTag() }).select().single());
  globalCleanups.push(async () => {
    await service.from("week_templates").delete().eq("id", template.id);
  });
  const list = await must(service.from("shopping_lists").insert({ start_date: uniqueDate(), days: 7 }).select().single());
  globalCleanups.push(async () => {
    await service.from("shopping_lists").delete().eq("id", list.id);
  });
  base = {
    supplierId: supplier.id,
    recipeId: recipe.id,
    ingredientId: ingredient.id,
    templateId: template.id,
    listId: list.id,
  };
});

afterAll(async () => {
  // Falls der Löschversuch auf settings je durchgegangen wäre, die Zeile wiederherstellen.
  await service.from("settings").upsert({ id: 1 });
  await runCleanups(globalCleanups);
});

// ---------------------------------------------------------------------------
// Rechte je Rolle und Tabelle
// ---------------------------------------------------------------------------

describe.each(ACTORS)("Rolle %s", (actor) => {
  describe.concurrent.each(Object.entries(tables))("Tabelle %s", (table, spec) => {
    it("lesen, einfügen, ändern, löschen nach SPEC 5", async () => {
      const cleanups: Cleanup[] = [];
      const client = clients[actor];
      try {
        const fixture = await makeFixture(table, spec, cleanups);
        const key = keyOf(fixture, spec.pk);

        const read = await client.from(table).select().match(key);
        expect(affected(read), "lesen").toBe(READERS.includes(actor));

        const insert = await client.from(table).insert(await spec.payload(cleanups)).select();
        if (affected(insert)) {
          const insertedKey = keyOf(insert.data![0], spec.pk);
          cleanups.push(async () => {
            await service.from(table).delete().match(insertedKey);
          });
        }
        expect(affected(insert), "einfügen").toBe(spec.insert.includes(actor));

        const update = await client.from(table).update(spec.patch).match(key).select();
        expect(affected(update), "ändern").toBe(spec.update.includes(actor));

        // Gelöscht wird eine eigene Wegwerfzeile. profiles und settings werden nie angelegt oder
        // entfernt, dort gilt der Versuch auf die Fixture selbst (kein grant, also immer verboten).
        const victim = spec.delete.length > 0 ? await makeFixture(table, spec, cleanups) : fixture;
        const del = await client.from(table).delete().match(keyOf(victim, spec.pk)).select();
        expect(affected(del), "löschen").toBe(spec.delete.includes(actor));
      } finally {
        await runCleanups(cleanups);
      }
    });
  });
});

describe("Hilfsfunktionen und Eskalation", () => {
  it("has_role liefert nur für aktive Nutzer mit der Rolle true", async () => {
    for (const actor of READERS) {
      const { data, error } = await clients[actor].rpc("has_role", { r: "admin" });
      expect(error).toBeNull();
      expect(data, actor).toBe(actor === "admin");
    }
    const inactive = await clients.deaktiviert.rpc("has_role", { r: "admin" });
    expect(inactive.data).toBe(false);
  });

  it("Anonyme dürfen has_role und is_active_user nicht aufrufen", async () => {
    expect((await clients.anon.rpc("has_role", { r: "admin" })).error).not.toBeNull();
    expect((await clients.anon.rpc("is_active_user")).error).not.toBeNull();
  });

  it.each(["planung", "kueche", "einkauf", "ohne_rolle", "deaktiviert"] as const)(
    "%s kann die eigenen Rollen nicht ändern",
    async (actor) => {
      const result = await clients[actor]
        .from("profiles")
        .update({ roles: ["admin"], active: true })
        .eq("id", userIds[actor])
        .select();
      expect(affected(result)).toBe(false);
      const stored = await must(service.from("profiles").select().eq("id", userIds[actor]).single());
      // Der deaktivierte Testnutzer ist absichtlich Admin und muss deaktiviert bleiben.
      expect(stored.roles.includes("admin")).toBe(actor === "deaktiviert");
      expect(stored.active).toBe(actor !== "deaktiviert");
    },
  );

  it("Anonyme sehen nichts, auch nicht per Select auf alle Zeilen", async () => {
    for (const table of Object.keys(tables)) {
      const { data } = await clients.anon.from(table).select();
      expect(data ?? [], table).toEqual([]);
    }
  });

  it("deaktivierte Nutzer sehen nichts, obwohl sie Admin Rollen haben", async () => {
    for (const table of Object.keys(tables)) {
      const { data } = await clients.deaktiviert.from(table).select();
      expect(data ?? [], table).toEqual([]);
    }
  });
});

describe("Audit Spalten", () => {
  it("updated_by und created_by werden aus dem angemeldeten Nutzer gesetzt", async () => {
    const recipe = await must(service.from("recipes").insert({ name: nextTag(), course: "hauptgang" }).select().single());
    const extra = await must(
      clients.einkauf.from("shopping_extras").insert({ list_id: base.listId, text: nextTag() }).select().single(),
    );
    const feedback = await must(
      clients.kueche.from("kitchen_feedback").insert({ date: uniqueDate(), course: "hauptgang", liked: "ja" }).select().single(),
    );
    try {
      expect(extra.created_by).toBe(userIds.einkauf);
      expect(feedback.created_by).toBe(userIds.kueche);

      await must(clients.planung.from("recipes").update({ notes: "rls" }).eq("id", recipe.id).select());
      const after = await must(service.from("recipes").select().eq("id", recipe.id).single());
      expect(after.updated_by).toBe(userIds.planung);
      expect(new Date(after.updated_at).getTime()).toBeGreaterThan(new Date(recipe.updated_at).getTime());
    } finally {
      await service.from("recipes").delete().eq("id", recipe.id);
      await service.from("shopping_extras").delete().eq("id", extra.id);
      await service.from("kitchen_feedback").delete().match({ date: feedback.date, course: feedback.course });
    }
  });
});

describe("Profil Trigger", () => {
  async function profileFor(options: Parameters<typeof createTestUser>[1], label: string) {
    const cleanups: Cleanup[] = [];
    const user = await createTestUser(label, options);
    await deleteUserLater(user.id, cleanups);
    try {
      const profile = await must(service.from("profiles").select().eq("id", user.id).single());
      return { profile, email: user.email };
    } finally {
      await runCleanups(cleanups);
    }
  }

  it("ignoriert Rollen aus user_metadata ohne Einladung (kein Selbst Admin per Registrierung)", async () => {
    const { profile } = await profileFor(
      { user_metadata: { roles: ["admin"], display_name: "Test Name" } },
      "trg-user",
    );
    expect(profile.roles).toEqual([]);
    expect(profile.display_name).toBe("Test Name");
    expect(profile.active).toBe(true);
  });

  it("nimmt ohne Namen die Mailadresse", async () => {
    const { profile, email } = await profileFor({}, "trg-mail");
    expect(profile.display_name).toBe(email);
  });
});

describe("Constraints und Seed", () => {
  it("erlaubt nur die 14 Allergen Schlüssel", async () => {
    const bad = await service.from("ingredients").insert({ name: nextTag(), allergens: ["milch", "foo"] });
    expect(bad.error?.code).toBe("23514");
    const good = await must(service.from("ingredients").insert({ name: nextTag(), allergens: ["milch", "sellerie"] }).select().single());
    expect(good.allergens_checked).toBe(false);
    await service.from("ingredients").delete().eq("id", good.id);
  });

  it("Zutatennamen sind ohne Groß und Kleinschreibung eindeutig", async () => {
    const name = nextTag();
    const first = await must(service.from("ingredients").insert({ name }).select().single());
    try {
      const dupe = await service.from("ingredients").insert({ name: name.toUpperCase() });
      expect(dupe.error?.code).toBe("23505");
    } finally {
      await service.from("ingredients").delete().eq("id", first.id);
    }
  });

  it("settings hat genau eine Zeile und der Startmontag muss ein Montag sein", async () => {
    const rows = await mustList(service.from("settings").select());
    expect(rows).toHaveLength(1);
    expect((await service.from("settings").insert({ id: 2 })).error).not.toBeNull();
    expect((await service.from("settings").update({ rotation_start: "2026-10-06" }).eq("id", 1)).error?.code).toBe("23514");
  });

  it("Seed: Lieferanten und Warengruppen mit Standardlieferant", async () => {
    const groups = await mustList(service.from("product_groups").select("name, suppliers(name)"));
    const byName = Object.fromEntries(groups.map((g) => [g.name, g.suppliers?.name]));
    expect(byName).toMatchObject({
      Gemüse: "Bio-Bauer",
      Obst: "Bio-Bauer",
      Milchprodukte: "Bio-Bauer",
      "Getreide und Teigwaren": "Großhandel",
      Grundnahrungsmittel: "Großhandel",
      Gewürze: "Großhandel",
      Tiefkühl: "Großhandel",
      Konserven: "Großhandel",
    });
  });
});

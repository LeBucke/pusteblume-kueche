import type { Metadata } from "next";
import Link from "next/link";
import { inputClass } from "@/components/admin/field";
import { RecipeAllergens } from "@/components/recipes/recipe-allergens";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip, CourseDot } from "@/components/ui/chip";
import { ALLERGENS, isAllergenKey, allergenName } from "@/lib/allergens";
import { requireAccess } from "@/lib/auth";
import {
  COURSE_LABELS,
  countIncomplete,
  filterRecipes,
  groupByCourse,
  usedCategories,
  type RecipeListItem,
} from "@/lib/recipes";
import { createClient } from "@/lib/supabase/server";
import { COURSES, type Course } from "@/lib/types";

export const metadata: Metadata = { title: "Rezepte" };

type SearchParams = { q?: string; gang?: string; kategorie?: string; ohne?: string; archiviert?: string };

const DOT: Record<Course, "starter" | "main" | "dessert"> = {
  vorspeise: "starter",
  hauptgang: "main",
  nachtisch: "dessert",
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await requireAccess("/rezepte");
  const canEdit = profile.roles.includes("planung") || profile.roles.includes("admin");
  const params = await searchParams;
  const q = params.q ?? "";
  const course = COURSES.find((c) => c === params.gang) ?? "";
  const category = params.kategorie ?? "";
  const without = params.ohne && isAllergenKey(params.ohne) ? params.ohne : "";
  const withArchived = params.archiviert === "1";

  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select(
      "id, name, course, category, archived, recipe_ingredients(ingredients(name, aliases, allergens, allergens_checked))",
    );

  const all: RecipeListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    course: row.course,
    category: row.category,
    archived: row.archived,
    ingredients: row.recipe_ingredients.flatMap((line) =>
      line.ingredients
        ? [
            {
              name: line.ingredients.name,
              aliases: line.ingredients.aliases,
              allergens: line.ingredients.allergens,
              allergensChecked: line.ingredients.allergens_checked,
            },
          ]
        : [],
    ),
  }));

  const filtered = filterRecipes(all, { q, course, category, withoutAllergen: without, withArchived });
  const groups = groupByCourse(filtered);
  const categories = usedCategories(all.filter((recipe) => withArchived || !recipe.archived));
  const incomplete = without ? countIncomplete(filtered) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">Rezepte</h1>
        {canEdit && (
          <Link href="/rezepte/neu" className={buttonClass("primary")}>
            Neues Rezept
          </Link>
        )}
      </div>

      <Card>
        <form method="get" role="search" className="grid gap-4 md:grid-cols-4 md:items-end">
          <div className="md:col-span-4">
            <label htmlFor="rezepte-suche" className="mb-1.5 block font-bold">
              Suche
            </label>
            <input
              id="rezepte-suche"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Name, Kategorie oder Zutat"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="rezepte-gang" className="mb-1.5 block font-bold">
              Gang
            </label>
            <select id="rezepte-gang" name="gang" defaultValue={course} className={inputClass}>
              <option value="">Alle Gänge</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {COURSE_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rezepte-kategorie" className="mb-1.5 block font-bold">
              Kategorie
            </label>
            <select id="rezepte-kategorie" name="kategorie" defaultValue={category} className={inputClass}>
              <option value="">Alle Kategorien</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rezepte-ohne" className="mb-1.5 block font-bold">
              Ohne Allergen
            </label>
            <select id="rezepte-ohne" name="ohne" defaultValue={without} className={inputClass}>
              <option value="">Kein Filter</option>
              {ALLERGENS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-4">
            <label className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 has-[:checked]:border-primary">
              <input
                type="checkbox"
                name="archiviert"
                value="1"
                defaultChecked={withArchived}
                className="size-5 accent-primary"
              />
              Archivierte zeigen
            </label>
            <Button type="submit">Filtern</Button>
            <Link href="/rezepte" className={buttonClass("secondary")}>
              Zurücksetzen
            </Link>
          </div>
        </form>
      </Card>

      {without && incomplete > 0 && (
        <p role="status" className="rounded-card-sm bg-closed px-4 py-3 text-closed-ink">
          Achtung: {incomplete} {incomplete === 1 ? "Rezept enthält" : "Rezepte enthalten"} ungeprüfte Zutaten. Ob{" "}
          {allergenName(without)} darin steckt, ist dort nicht sicher. Diese Rezepte sind mit „Allergenangaben
          unvollständig“ markiert.
        </p>
      )}

      {all.length === 0 && (
        <p className="text-muted">
          Noch keine Rezepte vorhanden.{" "}
          {canEdit && (
            <Link href="/rezepte/neu" className="font-bold text-primary-ink underline">
              Erstes Rezept anlegen
            </Link>
          )}
        </p>
      )}
      {all.length > 0 && filtered.length === 0 && <p className="text-muted">Kein Rezept passt zu diesen Filtern.</p>}

      {groups.map((group) => (
        <section key={group.course} aria-labelledby={`gang-${group.course}`} className="space-y-3">
          <h2 id={`gang-${group.course}`} className="flex items-center gap-3 font-display text-3xl font-bold">
            <CourseDot course={DOT[group.course]} />
            {COURSE_LABELS[group.course]}
            <span className="text-lg font-semibold text-muted">{group.recipes.length}</span>
          </h2>
          <ul className="grid list-none gap-3 md:grid-cols-2">
            {group.recipes.map((recipe) => (
              <li key={recipe.id}>
                <Card compact className="h-full space-y-2 border border-line-soft">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-display text-2xl font-bold">
                      <Link href={`/rezepte/${recipe.id}`} className="hover:underline">
                        {recipe.name}
                      </Link>
                    </h3>
                    {recipe.archived && <Chip variant="closed">Archiviert</Chip>}
                  </div>
                  <p className="text-muted">{recipe.category ?? "Ohne Kategorie"}</p>
                  <RecipeAllergens ingredients={recipe.ingredients} />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

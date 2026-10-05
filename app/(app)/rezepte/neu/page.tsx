import type { Metadata } from "next";
import Link from "next/link";
import { RecipeForm, type RecipeFormData } from "@/components/recipes/recipe-form";
import { Card } from "@/components/ui/card";
import { requireAccess } from "@/lib/auth";
import { recipeIdSchema } from "@/lib/recipes";
import { createClient } from "@/lib/supabase/server";
import { loadEditorOptions, toFormLines } from "../editor-data";

export const metadata: Metadata = { title: "Neues Rezept" };

export default async function Page({ searchParams }: { searchParams: Promise<{ kopie?: string }> }) {
  await requireAccess("/rezepte/neu");
  const copyId = recipeIdSchema.safeParse((await searchParams).kopie);

  const supabase = await createClient();
  const options = await loadEditorOptions(supabase);

  let recipe: RecipeFormData = {
    name: "",
    course: "hauptgang",
    category: "",
    baseChildren: String(options.defaults.children),
    baseAdults: String(options.defaults.adults),
    description: "",
    author: "",
    steps: "",
    notes: "",
    lines: [],
  };

  // Kopie: Alles vom Original, nur ohne ID. Gespeichert wird erst, wenn jemand auf „Rezept speichern“ klickt.
  let copyOf: string | null = null;
  if (copyId.success) {
    const [{ data: original }, { data: lines }] = await Promise.all([
      supabase.from("recipes").select("*").eq("id", copyId.data).maybeSingle(),
      supabase
        .from("recipe_ingredients")
        .select("amount, unit, note, ingredients(id, name, aliases)")
        .eq("recipe_id", copyId.data)
        .order("sort"),
    ]);
    if (original) {
      copyOf = original.name;
      recipe = {
        name: `${original.name} (Kopie)`,
        course: original.course,
        category: original.category ?? "",
        baseChildren: String(original.base_children),
        baseAdults: String(original.base_adults),
        description: original.description ?? "",
        author: original.author ?? "",
        steps: original.steps ?? "",
        notes: original.notes ?? "",
        lines: toFormLines(lines ?? []),
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={copyOf && copyId.success ? `/rezepte/${copyId.data}` : "/rezepte"} className="text-primary-ink underline">
          Zurück
        </Link>
        <h1 className="mt-2 font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">
          {copyOf ? "Kopie anlegen" : "Neues Rezept"}
        </h1>
        {copyOf && (
          <p className="mt-2 text-muted">
            Das ist eine Kopie von „{copyOf}“. Sie wird erst gespeichert, wenn du unten auf „Rezept speichern“ klickst.
          </p>
        )}
      </div>
      <Card>
        <RecipeForm
          cancelHref={copyOf && copyId.success ? `/rezepte/${copyId.data}` : "/rezepte"}
          ingredients={options.ingredients}
          categories={options.categories}
          recipe={recipe}
        />
      </Card>
    </div>
  );
}

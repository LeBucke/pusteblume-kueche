import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { Card } from "@/components/ui/card";
import { requireAccess } from "@/lib/auth";
import { recipeIdSchema } from "@/lib/recipes";
import { createClient } from "@/lib/supabase/server";
import { loadEditorOptions, toFormLines } from "../../editor-data";

export const metadata: Metadata = { title: "Rezept bearbeiten" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = recipeIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  await requireAccess(`/rezepte/${id.data}/bearbeiten`);

  const supabase = await createClient();
  const [{ data: recipe }, { data: lines }, options] = await Promise.all([
    supabase.from("recipes").select("*").eq("id", id.data).maybeSingle(),
    supabase
      .from("recipe_ingredients")
      .select("amount, unit, note, ingredients(id, name, aliases)")
      .eq("recipe_id", id.data)
      .order("sort"),
    loadEditorOptions(supabase),
  ]);
  if (!recipe) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/rezepte/${recipe.id}`} className="text-primary-ink underline">
          Zurück zum Rezept
        </Link>
        <h1 className="mt-2 font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">
          Rezept bearbeiten
        </h1>
      </div>
      <Card>
        <RecipeForm
          cancelHref={`/rezepte/${recipe.id}`}
          ingredients={options.ingredients}
          categories={options.categories}
          recipe={{
            id: recipe.id,
            name: recipe.name,
            course: recipe.course,
            category: recipe.category ?? "",
            baseChildren: String(recipe.base_children),
            baseAdults: String(recipe.base_adults),
            description: recipe.description ?? "",
            author: recipe.author ?? "",
            steps: recipe.steps ?? "",
            notes: recipe.notes ?? "",
            lines: toFormLines(lines ?? []),
          }}
        />
      </Card>
    </div>
  );
}

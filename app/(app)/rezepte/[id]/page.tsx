import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveForm } from "@/components/recipes/archive-form";
import { PrintButton } from "@/components/recipes/print-button";
import { RecipeAllergens } from "@/components/recipes/recipe-allergens";
import { ScaledIngredients } from "@/components/recipes/scaled-ingredients";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip, CourseDot } from "@/components/ui/chip";
import { requireAccess } from "@/lib/auth";
import { formatLong } from "@/lib/dates";
import {
  COURSE_LABELS,
  cookingDates,
  cookingSummary,
  feedbackText,
  recipeIdSchema,
  splitSteps,
} from "@/lib/recipes";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "Rezept" };

const DOT: Record<Course, "starter" | "main" | "dessert"> = {
  vorspeise: "starter",
  hauptgang: "main",
  nachtisch: "dessert",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAccess("/rezepte");
  const id = recipeIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const canEdit = profile.roles.includes("planung") || profile.roles.includes("admin");

  const supabase = await createClient();
  const [{ data: recipe }, { data: lineRows }, { data: settings }, { data: meals }] = await Promise.all([
    supabase.from("recipes").select("*").eq("id", id.data).maybeSingle(),
    supabase
      .from("recipe_ingredients")
      .select("id, amount, unit, note, ingredients(id, name, allergens, allergens_checked, archived)")
      .eq("recipe_id", id.data)
      .order("sort"),
    supabase.from("settings").select("default_children, default_adults, adult_factor").maybeSingle(),
    supabase.from("plan_meals").select("date, course").eq("recipe_id", id.data),
  ]);
  if (!recipe) notFound();

  // Termine und Rückmeldungen: erst wenn es Plandaten gibt, sonst bleibt der Block weg.
  const mealRows = meals ?? [];
  const mealDates = [...new Set(mealRows.map((meal) => meal.date))];
  const [{ data: closedRows }, { data: feedbackRows }] =
    mealDates.length > 0
      ? await Promise.all([
          supabase.from("plan_days").select("date").eq("closed", true).in("date", mealDates),
          supabase.from("kitchen_feedback").select("date, course, amount_rating, liked, note").in("date", mealDates),
        ])
      : [{ data: [] }, { data: [] }];

  const closed = new Set((closedRows ?? []).map((row) => row.date));
  const dates = cookingDates(mealDates, closed);
  const summary = cookingSummary(dates, mealRows.length > 0);
  const feedback = (feedbackRows ?? [])
    .filter((row) => mealRows.some((meal) => meal.date === row.date && meal.course === row.course))
    .filter((row) => !closed.has(row.date) && (row.amount_rating || row.liked || row.note))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const lines = (lineRows ?? []).flatMap((row) =>
    row.ingredients
      ? [
          {
            id: row.id,
            name: row.ingredients.name,
            amount: row.amount === null ? null : Number(row.amount),
            unit: row.unit,
            note: row.note,
            archived: row.ingredients.archived,
            allergens: row.ingredients.allergens,
            allergensChecked: row.ingredients.allergens_checked,
          },
        ]
      : [],
  );
  const steps = splitSteps(recipe.steps);

  return (
    <article className="space-y-6">
      <div className="space-y-3 print:hidden">
        <Link href="/rezepte" className="text-primary-ink underline">
          Alle Rezepte
        </Link>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <Link href={`/rezepte/${recipe.id}/bearbeiten`} className={buttonClass("primary")}>
                Bearbeiten
              </Link>
              <Link href={`/rezepte/neu?kopie=${recipe.id}`} className={buttonClass("secondary")}>
                Kopie anlegen
              </Link>
            </>
          )}
          <PrintButton />
        </div>
      </div>

      <Card className="space-y-5">
        <header className="space-y-3">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
            <CourseDot course={DOT[recipe.course]} />
            <span className="font-bold">{COURSE_LABELS[recipe.course]}</span>
            {recipe.category && <span>· {recipe.category}</span>}
            {recipe.author && <span>· Rezept von {recipe.author}</span>}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">{recipe.name}</h1>
            {recipe.archived && <Chip variant="closed">Archiviert</Chip>}
          </div>
          {recipe.description && <p className="max-w-[62ch] text-lg">{recipe.description}</p>}
          <RecipeAllergens
            ingredients={lines.map((l) => ({
              name: l.name,
              allergens: l.allergens,
              allergensChecked: l.allergensChecked,
            }))}
            detailed
          />
          {summary.length > 0 && <p className="text-muted print:hidden">{summary.join(". ")}.</p>}
        </header>

        <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <ScaledIngredients
            lines={lines}
            base={{ children: recipe.base_children, adults: recipe.base_adults }}
            defaults={{
              children: settings?.default_children ?? 20,
              adults: settings?.default_adults ?? 5,
            }}
            adultFactor={Number(settings?.adult_factor ?? 1.5)}
          />

          <div className="space-y-6">
            <section aria-labelledby="zubereitung">
              <h2 id="zubereitung" className="mb-2 font-display text-2xl font-bold">
                Zubereitung
              </h2>
              {steps.length === 0 ? (
                <p className="text-muted">Noch keine Zubereitung.</p>
              ) : (
                <ol className="list-decimal space-y-2 pl-6 text-[17px] leading-snug marker:font-bold">
                  {steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )}
            </section>
            {recipe.notes && (
              <section aria-labelledby="hinweise">
                <h2 id="hinweise" className="mb-2 font-display text-2xl font-bold">
                  Hinweise
                </h2>
                <p className="whitespace-pre-line">{recipe.notes}</p>
              </section>
            )}
          </div>
        </div>
      </Card>

      {feedback.length > 0 && (
        <section
          aria-labelledby="rueckmeldungen"
          className="space-y-3 rounded-card bg-info p-5 text-info-ink md:p-6 print:hidden"
        >
          <h2 id="rueckmeldungen" className="font-display text-2xl font-bold">
            Rückmeldungen der Küche
          </h2>
          <ul className="list-none space-y-2">
            {feedback.map((row) => {
              const text = feedbackText({ amountRating: row.amount_rating, liked: row.liked });
              return (
                <li key={`${row.date}-${row.course}`}>
                  <span className="font-bold">{formatLong(row.date)}</span>
                  {text && `: ${text}`}
                  {row.note && <span className="block">{row.note}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {canEdit && (
        <Card compact className="border border-line-soft print:hidden">
          <ArchiveForm id={recipe.id} archived={recipe.archived} />
        </Card>
      )}
    </article>
  );
}

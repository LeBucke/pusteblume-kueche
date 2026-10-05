import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { requireAccess } from "@/lib/auth";
import { ingredientIdSchema } from "@/lib/ingredients";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Zutat bearbeiten" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAccess("/zutaten");
  const id = ingredientIdSchema.safeParse((await params).id);
  if (!id.success) notFound();

  const supabase = await createClient();
  const [{ data: ingredient }, { data: groups }, { data: suppliers }] = await Promise.all([
    supabase
      .from("ingredients")
      .select(
        "id, name, aliases, product_group_id, default_unit, supplier_id, allergens, allergens_checked, notes, archived",
      )
      .eq("id", id.data)
      .maybeSingle(),
    supabase.from("product_groups").select("id, name").order("sort").order("name"),
    supabase.from("suppliers").select("id, name").order("sort").order("name"),
  ]);
  if (!ingredient) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/zutaten" className="text-primary-ink underline">
          Zurück zu den Zutaten
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">
            {ingredient.name}
          </h1>
          {ingredient.archived && <Chip variant="closed">Archiviert</Chip>}
        </div>
      </div>
      <Card>
        <IngredientForm
          groups={groups ?? []}
          suppliers={suppliers ?? []}
          ingredient={{
            id: ingredient.id,
            name: ingredient.name,
            aliases: ingredient.aliases,
            productGroupId: ingredient.product_group_id ?? "",
            defaultUnit: ingredient.default_unit ?? "",
            supplierId: ingredient.supplier_id ?? "",
            allergens: ingredient.allergens,
            allergensChecked: ingredient.allergens_checked,
            notes: ingredient.notes ?? "",
            archived: ingredient.archived,
          }}
        />
      </Card>
    </div>
  );
}

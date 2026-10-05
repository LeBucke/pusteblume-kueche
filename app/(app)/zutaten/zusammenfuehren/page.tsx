import type { Metadata } from "next";
import Link from "next/link";
import { inputClass } from "@/components/admin/field";
import { AllergenChips } from "@/components/ingredients/allergen-chips";
import { MergeConfirm } from "@/components/ingredients/merge-confirm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAccess } from "@/lib/auth";
import { ingredientIdSchema } from "@/lib/ingredients";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Zutaten zusammenführen" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ quelle?: string; ziel?: string; fertig?: string }>;
}) {
  await requireAccess("/zutaten");
  const params = await searchParams;
  const doneCount = /^\d+$/.test(params.fertig ?? "") ? Number(params.fertig) : null;
  const sourceId = ingredientIdSchema.safeParse(params.quelle ?? "");
  const targetId = ingredientIdSchema.safeParse(params.ziel ?? "");

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("ingredients")
    .select("id, name, aliases, allergens, allergens_checked")
    .eq("archived", false)
    .order("name");
  const ingredients = rows ?? [];
  const source = sourceId.success ? ingredients.find((i) => i.id === sourceId.data) : undefined;
  const target = targetId.success ? ingredients.find((i) => i.id === targetId.data) : undefined;
  const same = source !== undefined && source.id === target?.id;
  const ready = source !== undefined && target !== undefined && !same;

  let recipeCount = 0;
  if (ready) {
    const { data: usage } = await supabase.from("recipe_ingredients").select("recipe_id").eq("ingredient_id", source.id);
    recipeCount = new Set((usage ?? []).map((row) => row.recipe_id)).size;
  }

  const allergensDiffer =
    ready &&
    (source.allergens_checked !== target.allergens_checked ||
      [...source.allergens].sort().join() !== [...target.allergens].sort().join());

  return (
    <div className="space-y-6">
      <div>
        <Link href="/zutaten" className="text-primary-ink underline">
          Zurück zu den Zutaten
        </Link>
        <h1 className="mt-2 font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">
          Zutaten zusammenführen
        </h1>
        <p className="mt-2 text-muted">
          Die Quellzutat geht in der Zielzutat auf: Alle Rezepte zeigen danach auf die Zielzutat, die Quelle wird
          archiviert und ihr Name bleibt als Synonym des Ziels auffindbar.
        </p>
      </div>

      {doneCount !== null && target && (
        <div role="status" className="space-y-2 rounded-card-sm bg-info px-4 py-3 text-info-ink">
          <p>
            Zusammengeführt. {doneCount} {doneCount === 1 ? "Rezept zeigt" : "Rezepte zeigen"} jetzt auf „{target.name}“.
          </p>
          <Link href={`/zutaten/${target.id}`} className="font-bold underline">
            Zur Zielzutat
          </Link>
        </div>
      )}

      <Card>
        <form method="get" className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label htmlFor="merge-quelle" className="mb-1.5 block font-bold">
              Quelle (wird archiviert)
            </label>
            <select id="merge-quelle" name="quelle" defaultValue={source?.id ?? ""} className={inputClass} required>
              <option value="">Bitte wählen</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="merge-ziel" className="mb-1.5 block font-bold">
              Ziel (bleibt bestehen)
            </label>
            <select id="merge-ziel" name="ziel" defaultValue={target?.id ?? ""} className={inputClass} required>
              <option value="">Bitte wählen</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Vorschau
          </Button>
        </form>
      </Card>

      {same && (
        <p role="alert" className="rounded-card-sm bg-allergen px-4 py-2 text-allergen-ink">
          Quelle und Ziel müssen verschiedene Zutaten sein.
        </p>
      )}

      {ready && (
        <Card className="space-y-4">
          <h2 className="font-display text-3xl font-bold">Vorschau</h2>
          <p className="text-lg">
            <strong>{recipeCount}</strong> {recipeCount === 1 ? "Rezept" : "Rezepte"} betroffen. „{source.name}“ wird
            archiviert, die Rezepte verwenden danach „{target.name}“.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-card-sm border border-line-soft p-4">
              <h3 className="font-display text-xl font-bold">Quelle: {source.name}</h3>
              <AllergenChips allergens={source.allergens} checked={source.allergens_checked} />
            </div>
            <div className="space-y-2 rounded-card-sm border border-line-soft p-4">
              <h3 className="font-display text-xl font-bold">Ziel: {target.name}</h3>
              <AllergenChips allergens={target.allergens} checked={target.allergens_checked} />
            </div>
          </div>

          {allergensDiffer && (
            <p role="alert" className="rounded-card-sm bg-allergen px-4 py-2 text-allergen-ink">
              Die Allergene oder der Prüfstatus unterscheiden sich. Es gelten danach die Angaben der Zielzutat. Prüfe
              vorher, ob sie für die betroffenen Rezepte stimmen.
            </p>
          )}

          <MergeConfirm key={`${source.id}-${target.id}`} sourceId={source.id} targetId={target.id} />
        </Card>
      )}
    </div>
  );
}

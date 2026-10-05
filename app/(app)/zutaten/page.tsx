import type { Metadata } from "next";
import Link from "next/link";
import { inputClass } from "@/components/admin/field";
import { AllergenChips } from "@/components/ingredients/allergen-chips";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { requireAccess } from "@/lib/auth";
import { resolveSupplier, searchIngredients } from "@/lib/ingredients";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Zutaten" };

const NO_GROUP = "keine";

type SearchParams = { q?: string; gruppe?: string; ungeprueft?: string; archiviert?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAccess("/zutaten");
  const params = await searchParams;
  const q = params.q ?? "";
  const group = params.gruppe ?? "";
  const onlyUnchecked = params.ungeprueft === "1";
  const withArchived = params.archiviert === "1";

  const supabase = await createClient();
  const [{ data: ingredientRows }, { data: groupRows }, { data: supplierRows }] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, name, aliases, product_group_id, supplier_id, allergens, allergens_checked, archived"),
    supabase.from("product_groups").select("id, name, default_supplier_id").order("sort").order("name"),
    supabase.from("suppliers").select("id, name"),
  ]);
  const all = ingredientRows ?? [];
  const groups = groupRows ?? [];
  const suppliers = new Map((supplierRows ?? []).map((s) => [s.id, s.name]));
  const groupById = new Map(
    groups.map((g) => [g.id, { name: g.name, defaultSupplierId: g.default_supplier_id }]),
  );

  const uncheckedCount = all.filter((i) => !i.archived && !i.allergens_checked).length;
  const filtered = searchIngredients(
    all.filter(
      (i) =>
        (withArchived || !i.archived) &&
        (!onlyUnchecked || !i.allergens_checked) &&
        (group === "" || (group === NO_GROUP ? i.product_group_id === null : i.product_group_id === group)),
    ),
    q,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">Zutaten</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/zutaten/zusammenfuehren" className={buttonClass("secondary")}>
            Zusammenführen
          </Link>
          <Link href="/zutaten/neu" className={buttonClass("primary")}>
            Neue Zutat
          </Link>
        </div>
      </div>

      {uncheckedCount > 0 && (
        <p role="status" className="rounded-card-sm bg-closed px-4 py-3 text-closed-ink">
          Bei {uncheckedCount} {uncheckedCount === 1 ? "Zutat" : "Zutaten"} sind die Allergene noch ungeprüft.{" "}
          {!onlyUnchecked && (
            <Link href="/zutaten?ungeprueft=1" className="font-bold underline">
              Nur diese zeigen
            </Link>
          )}
        </p>
      )}

      <Card>
        <form method="get" className="grid gap-4 md:grid-cols-[2fr_1fr] md:items-end" role="search">
          <div>
            <label htmlFor="zutaten-suche" className="mb-1.5 block font-bold">
              Suche
            </label>
            <input
              id="zutaten-suche"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Name oder Synonym"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="zutaten-gruppe" className="mb-1.5 block font-bold">
              Warengruppe
            </label>
            <select id="zutaten-gruppe" name="gruppe" defaultValue={group} className={inputClass}>
              <option value="">Alle</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
              <option value={NO_GROUP}>Ohne Warengruppe</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <label className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 has-[:checked]:border-primary">
              <input type="checkbox" name="ungeprueft" value="1" defaultChecked={onlyUnchecked} className="size-5 accent-primary" />
              Allergene ungeprüft
            </label>
            <label className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 has-[:checked]:border-primary">
              <input type="checkbox" name="archiviert" value="1" defaultChecked={withArchived} className="size-5 accent-primary" />
              Archivierte zeigen
            </label>
            <Button type="submit">Filtern</Button>
            <Link href="/zutaten" className={buttonClass("secondary")}>
              Zurücksetzen
            </Link>
          </div>
        </form>
      </Card>

      <section aria-labelledby="zutaten-liste" className="space-y-3">
        <h2 id="zutaten-liste" className="font-display text-3xl font-bold">
          {filtered.length} {filtered.length === 1 ? "Zutat" : "Zutaten"}
        </h2>
        {filtered.length === 0 && <p className="text-muted">Keine Zutaten gefunden.</p>}
        <ul className="list-none space-y-3">
          {filtered.map((ingredient) => {
            const groupInfo = ingredient.product_group_id ? groupById.get(ingredient.product_group_id) : undefined;
            const supplier = resolveSupplier(
              { supplierId: ingredient.supplier_id, productGroupId: ingredient.product_group_id },
              suppliers,
              groupById,
            );
            return (
              <li key={ingredient.id}>
                <Card compact className="space-y-2 border border-line-soft">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-display text-2xl font-bold">
                      <Link href={`/zutaten/${ingredient.id}`} className="hover:underline">
                        {ingredient.name}
                      </Link>
                    </h3>
                    {ingredient.archived && <Chip variant="closed">Archiviert</Chip>}
                  </div>
                  {ingredient.aliases.length > 0 && (
                    <p className="text-muted">Auch: {ingredient.aliases.join(", ")}</p>
                  )}
                  <p className="text-muted">
                    {groupInfo?.name ?? "Ohne Warengruppe"}
                    {" · "}
                    {supplier
                      ? supplier.source === "ingredient"
                        ? `Lieferant: ${supplier.name} (abweichend)`
                        : `Lieferant: ${supplier.name}`
                      : "Ohne Lieferant"}
                  </p>
                  <AllergenChips allergens={ingredient.allergens} checked={ingredient.allergens_checked} />
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { QuickAllergenForm } from "@/components/ingredients/quick-allergen-form";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Allergene prüfen" };

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredients")
    .select("id, name, allergens, allergens_checked")
    .eq("archived", false)
    .eq("allergens_checked", false)
    .order("name");
  const ingredients = data ?? [];

  return (
    <section aria-labelledby="pruefen-liste" className="space-y-3">
      <h2 id="pruefen-liste" className="font-display text-3xl font-bold">
        Ungeprüft ({ingredients.length})
      </h2>
      <p className="text-muted">
        Rezepte mit ungeprüften Zutaten gelten überall als „Allergenangaben unvollständig“. Kreuze die Allergene an
        und hake „Allergene geprüft“ nur ab, wenn du sie kontrolliert hast.
      </p>
      {ingredients.length === 0 && (
        <p role="status" className="rounded-card-sm bg-info px-4 py-3 text-info-ink">
          Alle Zutaten sind geprüft.
        </p>
      )}
      <ul className="list-none space-y-3">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id}>
            <Card compact className="space-y-4 border border-line-soft">
              <h3 className="font-display text-2xl font-bold">
                <Link href={`/zutaten/${ingredient.id}`} className="hover:underline">
                  {ingredient.name}
                </Link>
              </h3>
              <QuickAllergenForm
                id={ingredient.id}
                allergens={ingredient.allergens}
                checked={ingredient.allergens_checked}
              />
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { Card } from "@/components/ui/card";
import { requireAccess } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Neue Zutat" };

export default async function Page() {
  await requireAccess("/zutaten");
  const supabase = await createClient();
  const [{ data: groups }, { data: suppliers }] = await Promise.all([
    supabase.from("product_groups").select("id, name").order("sort").order("name"),
    supabase.from("suppliers").select("id, name").order("sort").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/zutaten" className="text-primary-ink underline">
          Zurück zu den Zutaten
        </Link>
        <h1 className="mt-2 font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">
          Neue Zutat
        </h1>
      </div>
      <Card>
        <IngredientForm groups={groups ?? []} suppliers={suppliers ?? []} />
      </Card>
    </div>
  );
}

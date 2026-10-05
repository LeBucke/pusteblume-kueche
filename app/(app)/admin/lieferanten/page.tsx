import type { Metadata } from "next";
import { moveSupplier } from "@/app/(app)/admin/lieferanten/actions";
import { MoveButtons } from "@/components/admin/move-buttons";
import { SupplierForm } from "@/components/admin/supplier-form";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Lieferanten" };

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name, contact, notes")
    .order("sort")
    .order("name");
  const suppliers = data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-3xl font-bold">Lieferant anlegen</h2>
        <div className="mt-4">
          <SupplierForm />
        </div>
      </Card>

      <section aria-labelledby="lieferanten-liste" className="space-y-3">
        <h2 id="lieferanten-liste" className="font-display text-3xl font-bold">
          Lieferanten ({suppliers.length})
        </h2>
        <p className="text-muted">Die Reihenfolge bestimmt die Aufteilung der Einkaufsliste.</p>
        {suppliers.length === 0 && <p className="text-muted">Noch keine Lieferanten.</p>}
        <ol className="list-none space-y-3">
          {suppliers.map((supplier, index) => (
            <li key={supplier.id}>
              <Card compact className="flex flex-col gap-4 border border-line-soft md:flex-row">
                <div className="flex items-start gap-3 md:flex-col">
                  <span className="font-display text-2xl font-bold text-muted" aria-hidden="true">
                    {index + 1}
                  </span>
                  <MoveButtons
                    id={supplier.id}
                    name={supplier.name}
                    action={moveSupplier}
                    isFirst={index === 0}
                    isLast={index === suppliers.length - 1}
                  />
                </div>
                <div className="flex-1">
                  <SupplierForm
                    supplier={{
                      id: supplier.id,
                      name: supplier.name,
                      contact: supplier.contact ?? "",
                      notes: supplier.notes ?? "",
                    }}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

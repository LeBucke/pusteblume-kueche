import type { Metadata } from "next";
import { moveProductGroup } from "@/app/(app)/admin/warengruppen/actions";
import { MoveButtons } from "@/components/admin/move-buttons";
import { ProductGroupForm } from "@/components/admin/product-group-form";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Warengruppen" };

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: groupRows }, { data: supplierRows }] = await Promise.all([
    supabase.from("product_groups").select("id, name, default_supplier_id").order("sort").order("name"),
    supabase.from("suppliers").select("id, name").order("sort").order("name"),
  ]);
  const groups = groupRows ?? [];
  const suppliers = supplierRows ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-3xl font-bold">Warengruppe anlegen</h2>
        <div className="mt-4">
          <ProductGroupForm suppliers={suppliers} />
        </div>
      </Card>

      <section aria-labelledby="gruppen-liste" className="space-y-3">
        <h2 id="gruppen-liste" className="font-display text-3xl font-bold">
          Warengruppen ({groups.length})
        </h2>
        <p className="text-muted">Die Reihenfolge gilt für die Einkaufsliste.</p>
        {groups.length === 0 && <p className="text-muted">Noch keine Warengruppen.</p>}
        <ol className="list-none space-y-3">
          {groups.map((group, index) => (
            <li key={group.id}>
              <Card compact className="flex flex-col gap-4 border border-line-soft md:flex-row">
                <div className="flex items-start gap-3 md:flex-col">
                  <span className="font-display text-2xl font-bold text-muted" aria-hidden="true">
                    {index + 1}
                  </span>
                  <MoveButtons
                    id={group.id}
                    name={group.name}
                    action={moveProductGroup}
                    isFirst={index === 0}
                    isLast={index === groups.length - 1}
                  />
                </div>
                <div className="flex-1">
                  <ProductGroupForm
                    suppliers={suppliers}
                    group={{
                      id: group.id,
                      name: group.name,
                      defaultSupplierId: group.default_supplier_id ?? "",
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

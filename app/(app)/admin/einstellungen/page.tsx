import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { formatNumber } from "@/lib/quantities";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("default_children, default_adults, adult_factor")
    .eq("id", 1)
    .single();

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-3xl font-bold">Standard für Rezepte und Plan</h2>
        <p className="mt-1 mb-4 text-muted">
          Gilt für alle Tage ohne eigene Zahlen. Der Erwachsenenfaktor steht mit Komma, zum Beispiel 1,5.
        </p>
        {settings ? (
          <SettingsForm
            values={{
              defaultChildren: String(settings.default_children),
              defaultAdults: String(settings.default_adults),
              adultFactor: formatNumber(Number(settings.adult_factor)),
            }}
          />
        ) : (
          <p role="alert" className="rounded-card-sm bg-allergen px-4 py-2 text-allergen-ink">
            Die Einstellungen konnten nicht geladen werden.
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <section aria-labelledby="rotation">
          <h2 id="rotation" className="font-display text-2xl font-bold">
            Rotation
          </h2>
          <p className="text-muted">Startmontag und Reihenfolge der Vorlagen kommen mit Paket 08.</p>
        </section>
        <section aria-labelledby="elternansicht" className="border-t border-line-soft pt-4">
          <h2 id="elternansicht" className="font-display text-2xl font-bold">
            Elternansicht
          </h2>
          <p className="text-muted">
            An oder aus, Link erneuern, QR Code und Standardhaushalt kommen mit Paket 11.
          </p>
        </section>
      </Card>
    </div>
  );
}

import { ALLERGENS } from "@/lib/allergens";

export const ALLERGEN_CHECK_HINT =
  "Bei verarbeiteten Produkten (Brühe, Nudeln, Brot) gelten die Allergene des tatsächlich gekauften Produkts. Wechselt das Produkt, muss die Zutat neu geprüft werden.";

/**
 * Die 14 Allergene zum Ankreuzen und das Kennzeichen „Allergene geprüft“. Das Kennzeichen ist nie
 * vorangehakt: Ungeprüft darf nicht wie allergenfrei aussehen, das Prüfen ist eine bewusste Entscheidung.
 */
export function AllergenFields({
  idPrefix,
  selected = [],
  checked = false,
}: {
  idPrefix: string;
  selected?: readonly string[];
  checked?: boolean;
}) {
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 font-bold">Allergene</legend>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((allergen) => (
            <label
              key={allergen.key}
              htmlFor={`${idPrefix}-${allergen.key}`}
              className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 has-[:checked]:border-allergen-ink has-[:checked]:bg-allergen has-[:checked]:text-allergen-ink"
            >
              <input
                id={`${idPrefix}-${allergen.key}`}
                type="checkbox"
                name="allergens"
                value={allergen.key}
                defaultChecked={selected.includes(allergen.key)}
                className="size-5 accent-primary"
              />
              {allergen.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-card-sm bg-info p-4 text-info-ink">
        <label htmlFor={`${idPrefix}-geprueft`} className="flex min-h-touch cursor-pointer items-center gap-3 font-bold">
          <input
            id={`${idPrefix}-geprueft`}
            type="checkbox"
            name="allergensChecked"
            defaultChecked={checked}
            aria-describedby={`${idPrefix}-geprueft-hinweis`}
            className="size-5 shrink-0 accent-primary"
          />
          Allergene geprüft
        </label>
        <p id={`${idPrefix}-geprueft-hinweis`} className="mt-1">
          Nur ankreuzen, wenn die Allergene oben stimmen, auch wenn keines zutrifft. {ALLERGEN_CHECK_HINT}
        </p>
      </div>
    </div>
  );
}

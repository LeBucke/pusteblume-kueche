"use client";

import { useActionState, useEffect, useRef } from "react";
import { createIngredient, setIngredientArchived, updateIngredient } from "@/app/(app)/zutaten/actions";
import { Field, inputClass } from "@/components/admin/field";
import { FormMessage } from "@/components/admin/form-message";
import { useFormAction } from "@/components/admin/use-form-action";
import { AllergenFields } from "@/components/ingredients/allergen-fields";
import { Button } from "@/components/ui/button";
import { IDLE, type ActionState } from "@/lib/admin";
import { UNITS } from "@/lib/units";

export type IngredientData = {
  id: string;
  name: string;
  aliases: string[];
  productGroupId: string;
  defaultUnit: string;
  supplierId: string;
  allergens: string[];
  allergensChecked: boolean;
  notes: string;
  archived: boolean;
};

export type Option = { id: string; name: string };

/** Ohne `ingredient` legt das Formular eine neue Zutat an, sonst ändert es die vorhandene. */
export function IngredientForm({
  ingredient,
  groups,
  suppliers,
}: {
  ingredient?: IngredientData;
  groups: Option[];
  suppliers: Option[];
}) {
  const { state, pending, onSubmit } = useFormAction(ingredient ? updateIngredient : createIngredient);
  const [archiveState, archiveAction, archiving] = useActionState<ActionState, FormData>(
    setIngredientArchived,
    IDLE,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const prefix = ingredient ? `zutat-${ingredient.id}` : "zutat-neu";

  useEffect(() => {
    if (!ingredient && state.status === "ok") formRef.current?.reset();
  }, [ingredient, state]);

  return (
    <div className="space-y-4">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-5" noValidate>
        {ingredient && <input type="hidden" name="id" value={ingredient.id} />}

        <div className="grid gap-4 md:grid-cols-2">
          <Field id={`${prefix}-name`} name="name" label="Name" defaultValue={ingredient?.name} required />
          <Field
            id={`${prefix}-synonyme`}
            name="aliases"
            label="Synonyme"
            hint="Mit Komma trennen, z. B. Möhre, Karotte. Die Suche findet die Zutat auch darüber."
            defaultValue={ingredient?.aliases.join(", ")}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor={`${prefix}-gruppe`} className="mb-1.5 block font-bold">
              Warengruppe
            </label>
            <select
              id={`${prefix}-gruppe`}
              name="productGroupId"
              defaultValue={ingredient?.productGroupId ?? ""}
              className={inputClass}
            >
              <option value="">Ohne Warengruppe</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${prefix}-einheit`} className="mb-1.5 block font-bold">
              Standardeinheit
            </label>
            <select
              id={`${prefix}-einheit`}
              name="defaultUnit"
              defaultValue={ingredient?.defaultUnit ?? ""}
              className={inputClass}
            >
              <option value="">Keine</option>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${prefix}-lieferant`} className="mb-1.5 block font-bold">
              Abweichender Lieferant
            </label>
            <select
              id={`${prefix}-lieferant`}
              name="supplierId"
              defaultValue={ingredient?.supplierId ?? ""}
              className={inputClass}
              aria-describedby={`${prefix}-lieferant-hinweis`}
            >
              <option value="">Wie die Warengruppe</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <p id={`${prefix}-lieferant-hinweis`} className="mt-1 text-sm text-muted">
              Nur ausfüllen, wenn diese Zutat woanders gekauft wird als die übrige Warengruppe.
            </p>
          </div>
        </div>

        <AllergenFields
          idPrefix={prefix}
          selected={ingredient?.allergens}
          checked={ingredient?.allergensChecked ?? false}
        />

        <div>
          <label htmlFor={`${prefix}-notiz`} className="mb-1.5 block font-bold">
            Notiz
          </label>
          <textarea
            id={`${prefix}-notiz`}
            name="notes"
            rows={2}
            defaultValue={ingredient?.notes}
            className={`${inputClass} min-h-24 rounded-card-sm py-3`}
          />
        </div>

        <FormMessage state={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gespeichert …" : ingredient ? "Speichern" : "Zutat anlegen"}
        </Button>
      </form>

      {ingredient && (
        <form action={archiveAction} className="space-y-3 border-t border-line-soft pt-4">
          <input type="hidden" name="id" value={ingredient.id} />
          <input type="hidden" name="archived" value={ingredient.archived ? "false" : "true"} />
          <p className="text-muted">
            {ingredient.archived
              ? "Diese Zutat ist archiviert und taucht in keiner Auswahl auf."
              : "Archivierte Zutaten tauchen in keiner Auswahl mehr auf, bleiben aber in alten Rezepten erhalten."}
          </p>
          <FormMessage state={archiveState} />
          <Button type="submit" variant="secondary" disabled={archiving}>
            {ingredient.archived ? "Wieder aktivieren" : "Archivieren"}
          </Button>
        </form>
      )}
    </div>
  );
}

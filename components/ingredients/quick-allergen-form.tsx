"use client";

import { saveQuickAllergens } from "@/app/(app)/admin/allergene/actions";
import { FormMessage } from "@/components/admin/form-message";
import { useFormAction } from "@/components/admin/use-form-action";
import { AllergenFields } from "@/components/ingredients/allergen-fields";
import { Button } from "@/components/ui/button";

/** Schnellbearbeitung auf der Prüfseite: nur Allergene und Prüfstatus. */
export function QuickAllergenForm({
  id,
  allergens,
  checked,
}: {
  id: string;
  allergens: string[];
  checked: boolean;
}) {
  const { state, pending, onSubmit } = useFormAction(saveQuickAllergens);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <AllergenFields idPrefix={`pruefen-${id}`} selected={allergens} checked={checked} />
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Speichern"}
      </Button>
    </form>
  );
}

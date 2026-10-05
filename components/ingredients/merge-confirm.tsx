"use client";

import { mergeIngredients } from "@/app/(app)/zutaten/actions";
import { FormMessage } from "@/components/admin/form-message";
import { useFormAction } from "@/components/admin/use-form-action";
import { Button } from "@/components/ui/button";

/** Bestätigung des Zusammenführens, nachdem die Vorschau gezeigt wurde. Bei Erfolg leitet die Action weiter. */
export function MergeConfirm({ sourceId, targetId }: { sourceId: string; targetId: string }) {
  const { state, pending, onSubmit } = useFormAction(mergeIngredients);

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="sourceId" value={sourceId} />
      <input type="hidden" name="targetId" value={targetId} />
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Wird zusammengeführt …" : "Jetzt zusammenführen"}
      </Button>
    </form>
  );
}

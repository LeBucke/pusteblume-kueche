"use client";

import { useActionState } from "react";
import { setRecipeArchived } from "@/app/(app)/rezepte/actions";
import { FormMessage } from "@/components/admin/form-message";
import { Button } from "@/components/ui/button";
import { IDLE, type ActionState } from "@/lib/admin";

/** Archivieren statt Löschen: Pläne und Vorlagen verweisen auf Rezepte (SPEC 4.4). */
export function ArchiveForm({ id, archived }: { id: string; archived: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setRecipeArchived, IDLE);

  return (
    <form action={action} className="space-y-3 print:hidden">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="archived" value={archived ? "false" : "true"} />
      <p className="text-muted">
        {archived
          ? "Dieses Rezept ist archiviert. Es taucht in keiner Auswahlliste auf, bleibt aber in alten Plänen sichtbar."
          : "Archivierte Rezepte tauchen in keiner Auswahlliste mehr auf, bleiben aber in alten Plänen und Vorlagen erhalten."}
      </p>
      <FormMessage state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {archived ? "Wiederherstellen" : "Archivieren"}
      </Button>
    </form>
  );
}

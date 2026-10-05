"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createProductGroup,
  deleteProductGroup,
  updateProductGroup,
} from "@/app/(app)/admin/warengruppen/actions";
import { Field, inputClass } from "@/components/admin/field";
import { FormMessage } from "@/components/admin/form-message";
import { useFormAction } from "@/components/admin/use-form-action";
import { Button } from "@/components/ui/button";
import { IDLE, type ActionState } from "@/lib/admin";

export type ProductGroupData = {
  id: string;
  name: string;
  defaultSupplierId: string;
};

export type SupplierOption = { id: string; name: string };

/** Ohne `group` legt das Formular eine neue Warengruppe an, sonst ändert es die vorhandene. */
export function ProductGroupForm({
  group,
  suppliers,
}: {
  group?: ProductGroupData;
  suppliers: SupplierOption[];
}) {
  const { state, pending, onSubmit } = useFormAction(group ? updateProductGroup : createProductGroup);
  const [deleteState, deleteAction, deleting] = useActionState<ActionState, FormData>(
    deleteProductGroup,
    IDLE,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const prefix = group ? `gruppe-${group.id}` : "gruppe-neu";

  useEffect(() => {
    if (!group && state.status === "ok") formRef.current?.reset();
  }, [group, state]);

  return (
    <div className="space-y-3">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
        {group && <input type="hidden" name="id" value={group.id} />}
        <div className="grid gap-4 md:grid-cols-2">
          <Field id={`${prefix}-name`} name="name" label="Name" defaultValue={group?.name} required />
          <div>
            <label htmlFor={`${prefix}-lieferant`} className="mb-1.5 block font-bold">
              Standardlieferant
            </label>
            <select
              id={`${prefix}-lieferant`}
              name="defaultSupplierId"
              defaultValue={group?.defaultSupplierId ?? ""}
              className={inputClass}
            >
              <option value="">Kein Standardlieferant</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FormMessage state={state} />
        <Button type="submit" variant={group ? "secondary" : "primary"} disabled={pending}>
          {pending ? "Wird gespeichert …" : group ? "Speichern" : "Warengruppe anlegen"}
        </Button>
      </form>

      {group && (
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm(`Warengruppe „${group.name}“ wirklich löschen?`)) event.preventDefault();
          }}
          className="space-y-3 border-t border-line-soft pt-3"
        >
          <input type="hidden" name="id" value={group.id} />
          <FormMessage state={deleteState} />
          <Button type="submit" variant="secondary" disabled={deleting}>
            {deleting ? "Wird gelöscht …" : "Löschen"}
          </Button>
        </form>
      )}
    </div>
  );
}

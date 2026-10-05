"use client";

import { useEffect, useRef } from "react";
import { createSupplier, updateSupplier } from "@/app/(app)/admin/lieferanten/actions";
import { Field, textareaClass } from "@/components/admin/field";
import { FormMessage } from "@/components/admin/form-message";
import { useFormAction } from "@/components/admin/use-form-action";
import { Button } from "@/components/ui/button";

export type SupplierData = {
  id: string;
  name: string;
  contact: string;
  notes: string;
};

/** Ohne `supplier` legt das Formular einen neuen Lieferanten an, sonst ändert es den vorhandenen. */
export function SupplierForm({ supplier }: { supplier?: SupplierData }) {
  const { state, pending, onSubmit } = useFormAction(supplier ? updateSupplier : createSupplier);
  const formRef = useRef<HTMLFormElement>(null);
  const prefix = supplier ? `lieferant-${supplier.id}` : "lieferant-neu";

  useEffect(() => {
    if (!supplier && state.status === "ok") formRef.current?.reset();
  }, [supplier, state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
      {supplier && <input type="hidden" name="id" value={supplier.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <Field id={`${prefix}-name`} name="name" label="Name" defaultValue={supplier?.name} required />
        <Field
          id={`${prefix}-contact`}
          name="contact"
          label="Kontakt"
          hint="Telefon, Mail oder Ansprechperson"
          defaultValue={supplier?.contact}
        />
      </div>
      <div>
        <label htmlFor={`${prefix}-notes`} className="mb-1.5 block font-bold">
          Notiz
        </label>
        <textarea
          id={`${prefix}-notes`}
          name="notes"
          rows={2}
          defaultValue={supplier?.notes}
          className={textareaClass}
        />
      </div>
      <FormMessage state={state} />
      <Button type="submit" variant={supplier ? "secondary" : "primary"} disabled={pending}>
        {pending ? "Wird gespeichert …" : supplier ? "Speichern" : "Lieferant anlegen"}
      </Button>
    </form>
  );
}

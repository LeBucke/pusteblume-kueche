"use client";

import { useEffect, useRef } from "react";
import { inviteUser } from "@/app/(app)/admin/nutzer/actions";
import { Field } from "@/components/admin/field";
import { FormMessage } from "@/components/admin/form-message";
import { RoleCheckboxes } from "@/components/admin/role-checkboxes";
import { useFormAction } from "@/components/admin/use-form-action";
import { Button } from "@/components/ui/button";

export function InviteForm() {
  const { state, pending, onSubmit } = useFormAction(inviteUser);
  const formRef = useRef<HTMLFormElement>(null);

  // Nach einer erfolgreichen Einladung das Formular leeren, nach einem Fehler bleiben die Eingaben stehen.
  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="invite-name" name="displayName" label="Name" autoComplete="off" required />
        <Field
          id="invite-email"
          name="email"
          label="Mailadresse"
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          required
        />
      </div>
      <RoleCheckboxes idPrefix="invite-role" />
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Wird gesendet …" : "Einladung senden"}
      </Button>
    </form>
  );
}

"use client";

import { saveSettings } from "@/app/(app)/admin/einstellungen/actions";
import { Field } from "@/components/admin/field";
import { FormMessage } from "@/components/admin/form-message";
import { useFormAction } from "@/components/admin/use-form-action";
import { Button } from "@/components/ui/button";

export type SettingsFormValues = {
  defaultChildren: string;
  defaultAdults: string;
  adultFactor: string;
};

export function SettingsForm({ values }: { values: SettingsFormValues }) {
  const { state, pending, onSubmit } = useFormAction(saveSettings);

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 md:grid-cols-3">
        <Field
          id="default-children"
          name="defaultChildren"
          label="Kinder"
          inputMode="numeric"
          defaultValue={values.defaultChildren}
          required
        />
        <Field
          id="default-adults"
          name="defaultAdults"
          label="Erwachsene"
          inputMode="numeric"
          defaultValue={values.defaultAdults}
          required
        />
        <Field
          id="adult-factor"
          name="adultFactor"
          label="Erwachsenenfaktor"
          inputMode="decimal"
          hint="Eine Erwachsenenportion entspricht so vielen Kinderportionen."
          defaultValue={values.adultFactor}
          required
        />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Speichern"}
      </Button>
    </form>
  );
}

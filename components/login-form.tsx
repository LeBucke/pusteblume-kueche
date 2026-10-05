"use client";

import { useActionState } from "react";
import { requestMagicLink, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestMagicLink, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div role="status" className="space-y-3">
        <p className="font-display text-2xl font-bold">Schau in dein Postfach</p>
        <p className="text-muted">
          Wenn die Adresse bei uns eingetragen ist, haben wir dir einen Link zum Anmelden geschickt. Es kann
          eine Minute dauern.
        </p>
        <p className="text-muted">
          Öffne den Link bitte in demselben Browser und auf demselben Gerät, auf dem du ihn angefordert hast.
        </p>
        <a href="/login" className="inline-block rounded-full py-2 font-bold text-primary-ink underline">
          Andere Adresse verwenden
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block font-bold">
          Mailadresse
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          aria-describedby={state.status === "error" ? "email-fehler" : undefined}
          aria-invalid={state.status === "error"}
          className="min-h-touch w-full rounded-full border border-line bg-surface px-5 text-base text-ink placeholder:text-muted"
        />
        {state.status === "error" && (
          <p
            id="email-fehler"
            role="alert"
            className="mt-2 rounded-card-sm bg-allergen px-4 py-2 text-allergen-ink"
          >
            {state.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gesendet …" : "Link zum Anmelden senden"}
      </Button>
    </form>
  );
}

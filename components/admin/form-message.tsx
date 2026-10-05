import type { ActionState } from "@/lib/admin";

/** Rückmeldung unter einem Formular. Fehler werden sofort vorgelesen, Erfolg höflich. */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;

  if (state.status === "error") {
    return (
      <p role="alert" className="rounded-card-sm bg-allergen px-4 py-2 text-allergen-ink">
        {state.message}
      </p>
    );
  }
  return (
    <p role="status" className="rounded-card-sm bg-info px-4 py-2 text-info-ink">
      {state.message}
    </p>
  );
}

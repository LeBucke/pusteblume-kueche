"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/admin/form-message";
import { IDLE, type ActionState } from "@/lib/admin";

type MoveAction = (previous: ActionState, formData: FormData) => Promise<ActionState>;

const buttonClass =
  "inline-flex size-touch cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-xl text-ink hover:border-primary disabled:cursor-not-allowed disabled:opacity-40";

/** Zwei Pfeil-Buttons für die Reihenfolge. Ohne Drag and Drop, damit es auf dem Handy einfach bleibt. */
export function MoveButtons({
  id,
  name,
  action,
  isFirst,
  isLast,
}: {
  id: string;
  name: string;
  action: MoveAction;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, IDLE);

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          name="direction"
          value="up"
          disabled={pending || isFirst}
          aria-label={`${name} nach oben`}
          className={buttonClass}
        >
          <span aria-hidden="true">↑</span>
        </button>
        <button
          type="submit"
          name="direction"
          value="down"
          disabled={pending || isLast}
          aria-label={`${name} nach unten`}
          className={buttonClass}
        >
          <span aria-hidden="true">↓</span>
        </button>
      </form>
      {state.status === "error" && <FormMessage state={state} />}
    </div>
  );
}

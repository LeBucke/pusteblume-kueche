"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { IDLE, type ActionState } from "@/lib/admin";

/**
 * Wie useActionState, aber das Formular behält seine Eingaben. React 19 leert ein Formular nach jeder
 * Action, auch nach einem Fehler, und dann müsste man alles noch einmal eintippen. Deshalb wird
 * das Absenden hier selbst übernommen: `onSubmit` am <form>, kein `action`.
 */
export function useFormAction(action: (previous: ActionState, formData: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(action, IDLE);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(data));
  }

  return { state, pending, onSubmit };
}

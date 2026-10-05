"use client";

import {
  reinviteUser,
  setUserActive,
  setUserRoles,
} from "@/app/(app)/admin/nutzer/actions";
import { FormMessage } from "@/components/admin/form-message";
import { RoleCheckboxes } from "@/components/admin/role-checkboxes";
import { useFormAction } from "@/components/admin/use-form-action";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { ActionState } from "@/lib/admin";
import type { AppRole } from "@/lib/types";

export type UserRowData = {
  id: string;
  displayName: string;
  email: string;
  roles: AppRole[];
  active: boolean;
  /** Die Person hat die Einladung noch nicht angenommen. */
  invitePending: boolean;
  isSelf: boolean;
};

/** Die drei Formulare einer Person teilen sich einen Zustand, damit immer nur eine Meldung steht. */
function runAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  switch (formData.get("intent")) {
    case "roles":
      return setUserRoles(previous, formData);
    case "active":
      return setUserActive(previous, formData);
    default:
      return reinviteUser(previous, formData);
  }
}

export function UserRow({ user }: { user: UserRowData }) {
  const { state, pending, onSubmit } = useFormAction(runAction);

  return (
    <Card compact className="space-y-4 border border-line-soft">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="font-display text-2xl font-bold">{user.displayName}</h3>
        {user.isSelf && <Chip variant="info">Du</Chip>}
        {!user.active && <Chip variant="closed">Deaktiviert</Chip>}
        {user.invitePending && <Chip variant="allergen">Einladung offen</Chip>}
      </div>
      <p className="break-all text-muted">{user.email}</p>

      <form onSubmit={onSubmit} className="space-y-3">
        <input type="hidden" name="intent" value="roles" />
        <input type="hidden" name="userId" value={user.id} />
        <RoleCheckboxes idPrefix={`role-${user.id}`} selected={user.roles} />
        <Button type="submit" variant="secondary" disabled={pending}>
          Rollen speichern
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 border-t border-line-soft pt-4">
        <form onSubmit={onSubmit}>
          <input type="hidden" name="intent" value="active" />
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="active" value={user.active ? "false" : "true"} />
          <Button type="submit" variant="secondary" disabled={pending}>
            {user.active ? "Deaktivieren" : "Wieder aktivieren"}
          </Button>
        </form>
        {user.invitePending && (
          <form onSubmit={onSubmit}>
            <input type="hidden" name="intent" value="reinvite" />
            <input type="hidden" name="userId" value={user.id} />
            <Button type="submit" variant="secondary" disabled={pending}>
              Erneut einladen
            </Button>
          </form>
        )}
      </div>
      <FormMessage state={state} />
    </Card>
  );
}

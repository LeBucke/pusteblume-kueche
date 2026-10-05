import { ROLE_LABELS } from "@/lib/roles";
import { APP_ROLES, type AppRole } from "@/lib/types";

/** Rollen zum Ankreuzen. Jede Checkbox ist mit 44 px Höhe bedienbar. */
export function RoleCheckboxes({
  idPrefix,
  selected = [],
  legend = "Rollen",
}: {
  idPrefix: string;
  selected?: readonly AppRole[];
  legend?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {APP_ROLES.map((role) => (
          <label
            key={role}
            htmlFor={`${idPrefix}-${role}`}
            className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 has-[:checked]:border-primary"
          >
            <input
              id={`${idPrefix}-${role}`}
              type="checkbox"
              name="roles"
              value={role}
              defaultChecked={selected.includes(role)}
              className="size-5 accent-primary"
            />
            {ROLE_LABELS[role]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

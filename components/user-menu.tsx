import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ROLE_LABELS } from "@/lib/roles";
import type { AppRole } from "@/lib/types";

type UserMenuProps = {
  displayName: string;
  roles: readonly AppRole[];
};

/** Nutzermenü in der Kopfzeile: Name, Rollen und Abmelden. Ohne JavaScript über <details>. */
export function UserMenu({ displayName, roles }: UserMenuProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <details className="group relative ml-auto">
      <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2.5 rounded-full pr-2 pl-1 text-[15px] text-muted marker:hidden [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="inline-flex size-[34px] items-center justify-center rounded-full bg-course-starter font-extrabold text-ink"
        >
          {initial}
        </span>
        <span className="hidden max-w-40 truncate sm:inline">{displayName}</span>
        <span className="sr-only">Nutzermenü öffnen</span>
      </summary>
      <div className="absolute top-full right-0 z-20 mt-1 w-64 rounded-card-sm border border-line bg-surface p-4">
        <p className="truncate font-bold text-ink">{displayName}</p>
        <ul className="mt-2 mb-3 flex list-none flex-wrap gap-1.5">
          {roles.map((role) => (
            <li key={role}>
              <Chip variant="info">{ROLE_LABELS[role]}</Chip>
            </li>
          ))}
        </ul>
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full">
            Abmelden
          </Button>
        </form>
      </div>
    </details>
  );
}

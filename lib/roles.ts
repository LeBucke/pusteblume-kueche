/** Rollen, Startseiten, Navigation und Routenzugriff (SPEC 2 und 7a). Reine Funktionen, ohne Datenbank. */

import { APP_ROLES, type AppRole } from "./types";

/** Reihenfolge bei mehreren Rollen: die erste passende bestimmt die Startseite. */
const HOME_BY_ROLE: ReadonlyArray<readonly [AppRole, string]> = [
  ["planung", "/plan"],
  ["kueche", "/heute"],
  ["einkauf", "/einkauf"],
  ["admin", "/admin"],
];

export interface NavItem {
  href: string;
  label: string;
}

interface Section extends NavItem {
  /** Leer = alle Rollen. */
  roles: readonly AppRole[];
}

/** Reihenfolge wie in der Navigation. */
const SECTIONS: readonly Section[] = [
  { href: "/heute", label: "Heute", roles: [] },
  { href: "/plan", label: "Speiseplan", roles: [] },
  { href: "/rezepte", label: "Rezepte", roles: [] },
  { href: "/vorlagen", label: "Vorlagen", roles: ["planung", "admin"] },
  { href: "/einkauf", label: "Einkauf", roles: [] },
  { href: "/admin", label: "Admin", roles: ["admin"] },
];

/** Routen ohne Navigationspunkt, die trotzdem Einschränkungen haben. */
const HIDDEN_SECTIONS: readonly Pick<Section, "href" | "roles">[] = [
  { href: "/zutaten", roles: ["planung", "admin"] },
];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

/** Behält nur bekannte Rollen, ohne Doppelte. */
export function normalizeRoles(values: readonly unknown[] | null | undefined): AppRole[] {
  return APP_ROLES.filter((role) => values?.includes(role));
}

/** Startseite der Rolle, bei mehreren Rollen nach HOME_BY_ROLE. Ohne Rolle null. */
export function homePath(roles: readonly AppRole[]): string | null {
  for (const [role, path] of HOME_BY_ROLE) {
    if (roles.includes(role)) return path;
  }
  return null;
}

function allowed(required: readonly AppRole[], roles: readonly AppRole[]): boolean {
  return required.length === 0 || required.some((role) => roles.includes(role));
}

/** Navigationspunkte, die diese Rollen sehen. Ohne Rolle keine. */
export function navItemsFor(roles: readonly AppRole[]): NavItem[] {
  if (roles.length === 0) return [];
  return SECTIONS.filter((s) => allowed(s.roles, roles)).map(({ href, label }) => ({
    href,
    label,
  }));
}

/** Darf jemand mit diesen Rollen diese Route öffnen? Gilt für den Pfad und alles darunter. */
export function canAccess(roles: readonly AppRole[], pathname: string): boolean {
  if (roles.length === 0) return false;
  const section = [...SECTIONS, ...HIDDEN_SECTIONS].find(
    (s) => pathname === s.href || pathname.startsWith(`${s.href}/`),
  );
  return section ? allowed(section.roles, roles) : true;
}

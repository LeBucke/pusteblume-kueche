/** Prüfungen und Regeln für den Adminbereich (SPEC 4.1, 4.11). Reine Funktionen, ohne Datenbank. */

import { z } from "zod";
import { APP_ROLES, type AppRole } from "./types";

export type ActionState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export const IDLE: ActionState = { status: "idle" };

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.";
}

/** Zahl aus einem Textfeld, auch mit Komma. Leer oder Unsinn ergibt NaN. */
function parseDecimal(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim().replace(",", ".");
  return text === "" ? Number.NaN : Number(text);
}

const roles = z
  .array(z.enum(APP_ROLES, { error: "Unbekannte Rolle." }))
  .min(1, { error: "Bitte wähle mindestens eine Rolle." })
  .transform((values) => APP_ROLES.filter((role) => values.includes(role)));

export const requiredName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `Bitte gib ${label} ein.` })
    .max(80, { error: "Der Name ist zu lang (höchstens 80 Zeichen)." });

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Der Text ist zu lang (höchstens ${max} Zeichen).` })
    .transform((text) => (text === "" ? null : text));

export const inviteSchema = z.object({
  displayName: requiredName("einen Namen"),
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "Bitte gib eine gültige Mailadresse ein." })),
  roles,
});

export const rolesSchema = z.object({
  userId: z.uuid({ error: "Unbekannte Person." }),
  roles,
});

export const activeSchema = z.object({
  userId: z.uuid({ error: "Unbekannte Person." }),
  active: z.boolean(),
});

const headcount = (label: string) =>
  z.preprocess(
    parseDecimal,
    z
      .number({ error: `${label}: Bitte gib eine ganze Zahl ein.` })
      .int({ error: `${label}: Bitte gib eine ganze Zahl ein.` })
      .min(0, { error: `${label} darf nicht negativ sein.` })
      .max(500, { error: `${label}: Das ist zu viel (höchstens 500).` }),
  );

export const settingsSchema = z.object({
  defaultChildren: headcount("Kinder"),
  defaultAdults: headcount("Erwachsene"),
  adultFactor: z.preprocess(
    parseDecimal,
    z
      .number({ error: "Erwachsenenfaktor: Bitte gib eine Zahl ein, z. B. 1,5." })
      .gt(0, { error: "Der Erwachsenenfaktor muss größer als 0 sein." })
      .max(10, { error: "Der Erwachsenenfaktor ist zu groß (höchstens 10)." }),
  ),
});

export const idSchema = z.uuid({ error: "Unbekannter Eintrag." });

export const supplierSchema = z.object({
  name: requiredName("einen Namen"),
  contact: optionalText(200),
  notes: optionalText(1000),
});

export const productGroupSchema = z.object({
  name: requiredName("einen Namen"),
  defaultSupplierId: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.uuid({ error: "Unbekannter Lieferant." }).nullable()),
});

export const directionSchema = z.enum(["up", "down"], { error: "Unbekannte Richtung." });
export type Direction = z.infer<typeof directionSchema>;

export interface ProfileLike {
  id: string;
  roles: readonly AppRole[];
  active: boolean;
}

/**
 * Würde diese Änderung dazu führen, dass es keinen aktiven Admin mehr gibt?
 * Nur relevant, wenn die Person jetzt ein aktiver Admin ist: Gibt es schon keinen, blockiert nichts.
 */
export function leavesNoActiveAdmin(
  profiles: readonly ProfileLike[],
  userId: string,
  change: { roles?: readonly AppRole[]; active?: boolean },
): boolean {
  const target = profiles.find((profile) => profile.id === userId);
  if (!target || !target.active || !target.roles.includes("admin")) return false;

  return !profiles.some((profile) => {
    const roles = profile.id === userId ? (change.roles ?? profile.roles) : profile.roles;
    const active = profile.id === userId ? (change.active ?? profile.active) : profile.active;
    return active && roles.includes("admin");
  });
}

/** Verschiebt eine ID um einen Platz. Am Rand oder bei unbekannter ID bleibt die Reihenfolge gleich. */
export function moveItem(ids: readonly string[], id: string, direction: Direction): string[] {
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  const result = [...ids];
  if (from === -1 || to < 0 || to >= ids.length) return result;
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}

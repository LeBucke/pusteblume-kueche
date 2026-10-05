/**
 * Lokale Datumshilfen. Tagesdaten sind immer `YYYY-MM-DD` Strings.
 * Gerechnet wird mit UTC Kalendertagen, damit die Zeitumstellung keine Rolle spielt.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

const WEEKDAY_NAMES = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

function toUtcMs(date: string): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new Error(`Ungültiges Datum: ${date}`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`Ungültiges Datum: ${date}`);
  }
  return ms;
}

function fromUtcMs(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function isValidDate(date: string): boolean {
  try {
    toUtcMs(date);
    return true;
  } catch {
    return false;
  }
}

/** Addiert Tage (auch negativ). */
export function addDays(date: string, days: number): string {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** Anzahl Tage von `from` bis `to` (negativ, wenn `to` früher liegt). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** Wochentag, Montag = 1 bis Sonntag = 7. */
export function weekday(date: string): number {
  const day = new Date(toUtcMs(date)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function isWeekend(date: string): boolean {
  return weekday(date) >= 6;
}

/** Montag der Woche, in der `date` liegt. */
export function mondayOf(date: string): string {
  return addDays(date, 1 - weekday(date));
}

/** `count` aufeinanderfolgende Tage ab `start`. */
export function eachDay(start: string, count: number): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => addDays(start, i));
}

/** Montag bis Freitag der Woche ab `monday`. */
export function weekdaysOfWeek(monday: string): string[] {
  return eachDay(mondayOf(monday), 5);
}

export function weekdayName(date: string): string {
  return WEEKDAY_NAMES[weekday(date) - 1];
}

/** Deutsches Kurzformat, z. B. `12.10.` */
export function formatShort(date: string): string {
  toUtcMs(date);
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.`;
}

/** Deutsches Langformat, z. B. `12.10.2026` */
export function formatLong(date: string): string {
  toUtcMs(date);
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`;
}

/** Heutiges Datum in Europe/Berlin. */
export function todayBerlin(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

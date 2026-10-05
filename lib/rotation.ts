/** Wochenrotation nach SPEC 4.6. */

import { daysBetween, eachDay, isWeekend, mondayOf, weekday } from "./dates";
import { COURSES, type Course, type PlanMeals, type Rotation } from "./types";

export interface RotationEntry {
  date: string;
  course: Course;
  recipeId: string;
  templateId: string;
}

/**
 * Position der Vorlage für die Woche mit diesem Montag:
 * `floor((M - start) / 7) mod n`, auch für Wochen vor dem Start.
 * Ohne Vorlagen (`count <= 0`) gibt es keine Position.
 */
export function templateIndexForWeek(
  monday: string,
  rotationStart: string,
  count: number,
): number | null {
  if (!(count > 0)) return null;
  const weeks = Math.floor(daysBetween(mondayOf(rotationStart), mondayOf(monday)) / 7);
  return ((weeks % count) + count) % count;
}

/**
 * Einträge, die die Rotation im Zeitraum (beide Enden eingeschlossen) neu anlegen würde.
 * Nur leere Gänge an offenen Wochentagen (Mo bis Fr), nichts wird überschrieben.
 */
export function applyRotation(
  range: { from: string; to: string },
  rotation: Rotation,
  existingPlan: Readonly<Record<string, PlanMeals>>,
  closedDays: ReadonlySet<string>,
): RotationEntry[] {
  if (!rotation.start || rotation.templates.length === 0) return [];

  const entries: RotationEntry[] = [];
  const length = daysBetween(range.from, range.to) + 1;

  for (const date of eachDay(range.from, length)) {
    if (isWeekend(date) || closedDays.has(date)) continue;

    const index = templateIndexForWeek(mondayOf(date), rotation.start, rotation.templates.length);
    if (index === null) continue;
    const template = rotation.templates[index];
    const existing = existingPlan[date] ?? {};

    for (const course of COURSES) {
      if (existing[course]) continue;
      const meal = template.meals.find((m) => m.weekday === weekday(date) && m.course === course);
      if (meal) entries.push({ date, course, recipeId: meal.recipeId, templateId: template.id });
    }
  }
  return entries;
}

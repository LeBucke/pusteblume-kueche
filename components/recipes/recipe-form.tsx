"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { saveRecipe } from "@/app/(app)/rezepte/actions";
import { Field, inputClass } from "@/components/admin/field";
import { FormMessage } from "@/components/admin/form-message";
import { useFormAction } from "@/components/admin/use-form-action";
import { IngredientPicker, type PickerIngredient } from "@/components/ingredients/ingredient-picker";
import { Button } from "@/components/ui/button";
import { COURSE_LABELS } from "@/lib/recipes";
import { COURSES } from "@/lib/types";
import { UNITS } from "@/lib/units";

export type RecipeFormIngredient = PickerIngredient & { defaultUnit: string | null };

export type RecipeFormLine = {
  ingredient: PickerIngredient | null;
  /** Menge als Text, damit das Komma erhalten bleibt. */
  amount: string;
  unit: string;
  note: string;
};

export type RecipeFormData = {
  /** Fehlt bei einem neuen Rezept (auch bei einer Kopie). */
  id?: string;
  name: string;
  course: string;
  category: string;
  baseChildren: string;
  baseAdults: string;
  description: string;
  author: string;
  steps: string;
  notes: string;
  lines: RecipeFormLine[];
};

type Row = RecipeFormLine & { key: number; focusOnMount: boolean };

const EMPTY_ROW: RecipeFormLine = { ingredient: null, amount: "", unit: "", note: "" };

const smallInput = `${inputClass} px-4`;

/**
 * Editor für ein Rezept (neu, Kopie und bearbeiten). Die Zutatenzeilen liegen im Zustand der Komponente
 * und gehen als JSON im versteckten Feld `lines` mit, weil die Menge mit Komma als Text ankommen soll.
 *
 * Tastatur: Tab geht Zutat, Menge, Einheit, Notiz, dann die Zeilen-Buttons. Enter springt stattdessen zum
 * nächsten Feld der Zeile, in der Notiz zur nächsten Zeile (in der letzten Zeile entsteht eine neue).
 */
export function RecipeForm({
  recipe,
  ingredients,
  categories,
  cancelHref,
}: {
  recipe: RecipeFormData;
  ingredients: readonly RecipeFormIngredient[];
  categories: readonly string[];
  cancelHref: string;
}) {
  const { state, pending, onSubmit } = useFormAction(saveRecipe);
  // Neue Zeilen brauchen einen Schlüssel, den keine vorhandene Zeile hat (ohne Zeilen starten drei leere).
  const nextKey = useRef(Math.max(recipe.lines.length, 3));
  const rowsRef = useRef<HTMLOListElement>(null);
  const [rows, setRows] = useState<Row[]>(() => {
    const lines = recipe.lines.length > 0 ? recipe.lines : [EMPTY_ROW, EMPTY_ROW, EMPTY_ROW];
    return lines.map((line, index) => ({ ...line, key: index, focusOnMount: false }));
  });

  const defaultUnits = useMemo(() => new Map(ingredients.map((i) => [i.id, i.defaultUnit])), [ingredients]);
  const pickerList = useMemo(() => {
    // Archivierte Zutaten, die schon im Rezept stehen, bleiben als Auswahl erhalten.
    const known = new Set(ingredients.map((i) => i.id));
    const kept = recipe.lines.flatMap((line) => (line.ingredient && !known.has(line.ingredient.id) ? [line.ingredient] : []));
    return [...ingredients, ...kept];
  }, [ingredients, recipe.lines]);

  const linesJson = JSON.stringify(
    rows.map((row) => ({ ingredientId: row.ingredient?.id ?? "", amount: row.amount, unit: row.unit, note: row.note })),
  );

  function update(key: number, patch: Partial<RecipeFormLine>) {
    setRows((list) => list.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    // Den Schlüssel außerhalb des Updaters vergeben: React ruft Updater im Entwicklungsmodus doppelt auf.
    const key = nextKey.current++;
    setRows((list) => [...list, { ...EMPTY_ROW, key, focusOnMount: true }]);
  }

  function remove(key: number) {
    const freshKey = nextKey.current++;
    setRows((list) =>
      list.length > 1 ? list.filter((row) => row.key !== key) : [{ ...EMPTY_ROW, key: freshKey, focusOnMount: false }],
    );
  }

  function move(key: number, direction: -1 | 1) {
    setRows((list) => {
      const from = list.findIndex((row) => row.key === key);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= list.length) return list;
      const copy = [...list];
      [copy[from], copy[to]] = [copy[to], copy[from]];
      return copy;
    });
  }

  function onRowsKeyDown(event: React.KeyboardEvent<HTMLOListElement>) {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement;
    if (target.tagName === "BUTTON") return;
    // Enter soll in den Zeilen nie das ganze Formular abschicken.
    event.preventDefault();

    const rowEl = target.closest<HTMLElement>("[data-row]");
    const container = rowsRef.current;
    if (!rowEl || !container) return;
    const field = target.getAttribute("data-field") ?? "zutat";
    const order = ["zutat", "menge", "einheit", "notiz"];
    const nextField = order[order.indexOf(field) + 1];
    const focusIn = (row: Element | null, name: string) =>
      (name === "zutat"
        ? row?.querySelector<HTMLElement>('input[role="combobox"]')
        : row?.querySelector<HTMLElement>(`[data-field="${name}"]`)
      )?.focus();

    if (nextField) {
      focusIn(rowEl, nextField);
    } else {
      const nextRow = rowEl.nextElementSibling;
      if (nextRow) focusIn(nextRow, "zutat");
      else addRow();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      {recipe.id && <input type="hidden" name="id" value={recipe.id} />}
      <input type="hidden" name="lines" value={linesJson} />

      <section aria-labelledby="rezept-grunddaten" className="space-y-4">
        <h2 id="rezept-grunddaten" className="font-display text-3xl font-bold">
          Grunddaten
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field id="rezept-name" name="name" label="Name" defaultValue={recipe.name} required maxLength={120} />
          </div>
          <div>
            <label htmlFor="rezept-gang" className="mb-1.5 block font-bold">
              Gang
            </label>
            <select id="rezept-gang" name="course" defaultValue={recipe.course} className={inputClass}>
              {COURSES.map((course) => (
                <option key={course} value={course}>
                  {COURSE_LABELS[course]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rezept-kategorie" className="mb-1.5 block font-bold">
              Kategorie
            </label>
            <input
              id="rezept-kategorie"
              name="category"
              list="rezept-kategorien"
              defaultValue={recipe.category}
              maxLength={60}
              aria-describedby="rezept-kategorie-hinweis"
              className={inputClass}
            />
            <datalist id="rezept-kategorien">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <p id="rezept-kategorie-hinweis" className="mt-1 text-sm text-muted">
              Frei wählbar, die Vorschläge helfen nur.
            </p>
          </div>
          <Field
            id="rezept-kinder"
            name="baseChildren"
            label="Grundmenge Kinder"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={recipe.baseChildren}
            required
          />
          <Field
            id="rezept-erwachsene"
            name="baseAdults"
            label="Grundmenge Erwachsene"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={recipe.baseAdults}
            required
          />
          <div className="md:col-span-2">
            <Field
              id="rezept-beschreibung"
              name="description"
              label="Kurzbeschreibung"
              defaultValue={recipe.description}
              maxLength={500}
            />
          </div>
          <Field id="rezept-autor" name="author" label="Rezept von" defaultValue={recipe.author} maxLength={80} />
        </div>
      </section>

      <section aria-labelledby="rezept-zutaten" className="space-y-4">
        <div>
          <h2 id="rezept-zutaten" className="font-display text-3xl font-bold">
            Zutaten
          </h2>
          <p className="mt-1 text-muted">
            Die Mengen gelten für die Grundmenge oben. Die Menge darf ein Komma haben, ohne Menge steht im Rezept „nach
            Bedarf“. Mit Enter geht es zum nächsten Feld, in der Notiz zur nächsten Zeile.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="hidden gap-3 px-1 font-bold md:grid md:grid-cols-[minmax(0,2.2fr)_6.5rem_7rem_minmax(0,1.4fr)_auto]"
        >
          <span>Zutat</span>
          <span>Menge</span>
          <span>Einheit</span>
          <span>Notiz</span>
          <span className="w-[9.25rem]" />
        </div>

        <ol ref={rowsRef} onKeyDown={onRowsKeyDown} className="list-none space-y-3">
          {rows.map((row, index) => {
            const label = row.ingredient?.name ?? `Zeile ${index + 1}`;
            return (
              <li
                key={row.key}
                data-row={row.key}
                className="grid gap-3 rounded-card-sm border border-line-soft p-3 md:grid-cols-[minmax(0,2.2fr)_6.5rem_7rem_minmax(0,1.4fr)_auto] md:items-start md:border-0 md:p-0"
              >
                <IngredientPicker
                  ingredients={pickerList}
                  initial={row.ingredient}
                  label={`Zutat, Zeile ${index + 1}`}
                  hideLabel
                  autoFocus={row.focusOnMount}
                  onSelect={(picked) => {
                    const unit = row.unit === "" ? (defaultUnits.get(picked.id) ?? "") : row.unit;
                    update(row.key, { ingredient: picked, unit });
                  }}
                  onClear={() => update(row.key, { ingredient: null })}
                />
                <div className="grid grid-cols-2 gap-3 md:contents">
                  <div>
                    <label htmlFor={`zeile-${row.key}-menge`} className="mb-1 block text-sm font-bold md:sr-only">
                      Menge
                    </label>
                    <input
                      id={`zeile-${row.key}-menge`}
                      data-field="menge"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={row.amount}
                      onChange={(event) => update(row.key, { amount: event.target.value })}
                      aria-label={`Menge, Zeile ${index + 1}`}
                      placeholder="nach Bedarf"
                      className={smallInput}
                    />
                  </div>
                  <div>
                    <label htmlFor={`zeile-${row.key}-einheit`} className="mb-1 block text-sm font-bold md:sr-only">
                      Einheit
                    </label>
                    <select
                      id={`zeile-${row.key}-einheit`}
                      data-field="einheit"
                      value={row.unit}
                      onChange={(event) => update(row.key, { unit: event.target.value })}
                      aria-label={`Einheit, Zeile ${index + 1}`}
                      className={smallInput}
                    >
                      <option value="">Keine</option>
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor={`zeile-${row.key}-notiz`} className="mb-1 block text-sm font-bold md:sr-only">
                    Notiz
                  </label>
                  <input
                    id={`zeile-${row.key}-notiz`}
                    data-field="notiz"
                    type="text"
                    autoComplete="off"
                    value={row.note}
                    maxLength={100}
                    onChange={(event) => update(row.key, { note: event.target.value })}
                    aria-label={`Notiz, Zeile ${index + 1}`}
                    placeholder="z. B. gewürfelt"
                    className={smallInput}
                  />
                </div>
                <div className="flex gap-2">
                  <RowButton
                    label={`${label} nach oben`}
                    disabled={index === 0}
                    onClick={() => move(row.key, -1)}
                    symbol="↑"
                  />
                  <RowButton
                    label={`${label} nach unten`}
                    disabled={index === rows.length - 1}
                    onClick={() => move(row.key, 1)}
                    symbol="↓"
                  />
                  <RowButton label={`${label} entfernen`} onClick={() => remove(row.key)} symbol="✕" />
                </div>
              </li>
            );
          })}
        </ol>

        <Button variant="secondary" onClick={addRow}>
          Zutat hinzufügen
        </Button>
      </section>

      <section aria-labelledby="rezept-zubereitung" className="space-y-4">
        <h2 id="rezept-zubereitung" className="font-display text-3xl font-bold">
          Zubereitung
        </h2>
        <div>
          <label htmlFor="rezept-schritte" className="mb-1.5 block font-bold">
            Schritte
          </label>
          <textarea
            id="rezept-schritte"
            name="steps"
            rows={8}
            defaultValue={recipe.steps}
            aria-describedby="rezept-schritte-hinweis"
            className={`${inputClass} rounded-card-sm py-3`}
          />
          <p id="rezept-schritte-hinweis" className="mt-1 text-sm text-muted">
            Jede Zeile wird ein nummerierter Schritt.
          </p>
        </div>
        <div>
          <label htmlFor="rezept-hinweise" className="mb-1.5 block font-bold">
            Hinweise
          </label>
          <textarea
            id="rezept-hinweise"
            name="notes"
            rows={3}
            defaultValue={recipe.notes}
            className={`${inputClass} rounded-card-sm py-3`}
          />
        </div>
      </section>

      <div className="space-y-3">
        <FormMessage state={state} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Rezept speichern"}
          </Button>
          <Link
            href={cancelHref}
            className="inline-flex min-h-touch items-center justify-center rounded-full border border-line bg-surface px-5 font-display font-bold hover:border-primary"
          >
            Abbrechen
          </Link>
        </div>
      </div>
    </form>
  );
}

function RowButton({
  label,
  symbol,
  onClick,
  disabled,
}: {
  label: string;
  symbol: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex size-touch shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-xl text-ink hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span aria-hidden="true">{symbol}</span>
    </button>
  );
}

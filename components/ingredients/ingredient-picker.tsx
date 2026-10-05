"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { createIngredientInline } from "@/app/(app)/zutaten/actions";
import { inputClass } from "@/components/admin/field";
import { foldText, searchIngredients, type SearchableIngredient } from "@/lib/ingredients";

export type PickerIngredient = SearchableIngredient;

const MAX_RESULTS = 8;

/**
 * Auswahl einer Zutat mit Suche über Name und Synonyme. Wer nichts Passendes findet, legt die Zutat
 * direkt an („Neue Zutat anlegen“, startet mit ungeprüften Allergenen und erscheint dann auf der
 * Prüfseite). Die Liste kommt von der aufrufenden Seite (nur nicht archivierte Zutaten).
 *
 * `onSelect` meldet die gewählte Zutat, `onClear` das Gegenteil (der Text wurde nach der Auswahl geändert).
 * Mit `name` schreibt die Komponente zusätzlich ein verstecktes Feld mit der ID, damit sie auch in einem
 * normalen Formular funktioniert. `hideLabel` blendet die Beschriftung nur visuell aus (für Tabellenzeilen).
 */
export function IngredientPicker({
  ingredients,
  onSelect,
  onClear,
  label = "Zutat",
  hideLabel = false,
  autoFocus = false,
  name,
  initial,
  canCreate = true,
}: {
  ingredients: readonly PickerIngredient[];
  onSelect?: (ingredient: PickerIngredient) => void;
  onClear?: () => void;
  label?: string;
  hideLabel?: boolean;
  autoFocus?: boolean;
  name?: string;
  initial?: PickerIngredient | null;
  canCreate?: boolean;
}) {
  const baseId = useId();
  const listId = `${baseId}-liste`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [created, setCreated] = useState<PickerIngredient[]>([]);
  const [selected, setSelected] = useState<PickerIngredient | null>(initial ?? null);
  const [query, setQuery] = useState(initial?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const all = useMemo(() => [...ingredients, ...created], [ingredients, created]);
  const matches = useMemo(() => searchIngredients(all, query).slice(0, MAX_RESULTS), [all, query]);

  const trimmed = query.trim();
  const folded = foldText(trimmed);
  const exactName = all.some(
    (ingredient) => foldText(ingredient.name) === folded || ingredient.aliases.some((alias) => foldText(alias) === folded),
  );
  const showCreate = canCreate && trimmed !== "" && !exactName;
  const optionCount = matches.length + (showCreate ? 1 : 0);

  function choose(ingredient: PickerIngredient) {
    setSelected(ingredient);
    setQuery(ingredient.name);
    setOpen(false);
    setMessage("");
    onSelect?.(ingredient);
  }

  function create() {
    setMessage("");
    startTransition(async () => {
      const result = await createIngredientInline(trimmed);
      if (result.status === "ok") {
        setCreated((list) => [...list, result.ingredient]);
        choose(result.ingredient);
        setMessage(`„${result.ingredient.name}“ angelegt. Die Allergene sind noch ungeprüft.`);
      } else {
        setMessage(result.message);
        if (result.existing) setCreated((list) => [...list, result.existing!]);
      }
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(optionCount - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && optionCount > 0) {
      event.preventDefault();
      if (active < matches.length) choose(matches[active]);
      else create();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={`${baseId}-eingabe`} className={hideLabel ? "sr-only" : "mb-1.5 block font-bold"}>
        {label}
      </label>
      {name && <input type="hidden" name={name} value={selected?.id ?? ""} />}
      <input
        ref={inputRef}
        id={`${baseId}-eingabe`}
        type="text"
        role="combobox"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && optionCount > 0 ? `${baseId}-option-${active}` : undefined}
        value={query}
        disabled={pending}
        placeholder="Zutat suchen"
        className={inputClass}
        onChange={(event) => {
          setQuery(event.target.value);
          if (selected) onClear?.();
          setSelected(null);
          setOpen(true);
          setActive(0);
          setMessage("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />

      {open && optionCount > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Treffer"
          className="absolute z-10 mt-1 max-h-80 w-full list-none overflow-auto rounded-card-sm border border-line bg-surface p-1"
        >
          {matches.map((ingredient, index) => {
            const viaAlias = foldText(ingredient.name).includes(foldText(trimmed))
              ? null
              : ingredient.aliases.find((alias) => foldText(alias).includes(foldText(trimmed)));
            return (
              <li
                key={ingredient.id}
                id={`${baseId}-option-${index}`}
                role="option"
                aria-selected={index === active}
                // mousedown statt click, weil das Eingabefeld sonst vorher den Fokus verliert und die Liste schließt
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(ingredient);
                }}
                className={`flex min-h-touch cursor-pointer flex-col justify-center rounded-full px-4 ${
                  index === active ? "bg-ground" : ""
                }`}
              >
                <span className="font-bold">{ingredient.name}</span>
                {viaAlias && <span className="text-sm text-muted">Synonym: {viaAlias}</span>}
              </li>
            );
          })}
          {showCreate && (
            <li
              id={`${baseId}-option-${matches.length}`}
              role="option"
              aria-selected={active === matches.length}
              onMouseDown={(event) => {
                event.preventDefault();
                create();
              }}
              className={`flex min-h-touch cursor-pointer items-center rounded-full px-4 font-bold text-primary-ink ${
                active === matches.length ? "bg-ground" : ""
              }`}
            >
              Neue Zutat anlegen: „{trimmed}“
            </li>
          )}
        </ul>
      )}

      {open && optionCount === 0 && trimmed !== "" && (
        <p className="mt-1 text-sm text-muted">Keine Treffer.</p>
      )}
      <p role="status" className="mt-1 text-sm text-info-ink empty:hidden">
        {pending ? "Wird angelegt …" : message}
      </p>
    </div>
  );
}

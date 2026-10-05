"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/field";
import { formatAmount, scaleFactor } from "@/lib/quantities";

export type ScaledLine = {
  id: string;
  name: string;
  /** null = nach Bedarf */
  amount: number | null;
  unit: string | null;
  note: string | null;
  archived: boolean;
};

function toCount(value: string): number {
  const n = Math.floor(Number(value.replace(",", ".")));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : 0;
}

/**
 * Zutaten eines Rezepts, live auf Kinder und Erwachsene umgerechnet. Gerechnet wird in `lib/quantities.ts`,
 * hier stehen nur die Eingaben. Gedruckt wird der aktuelle Stand, die Eingabefelder bleiben dabei weg.
 */
export function ScaledIngredients({
  lines,
  base,
  defaults,
  adultFactor,
}: {
  lines: readonly ScaledLine[];
  base: { children: number; adults: number };
  defaults: { children: number; adults: number };
  adultFactor: number;
}) {
  const [children, setChildren] = useState(String(defaults.children));
  const [adults, setAdults] = useState(String(defaults.adults));
  const target = { children: toCount(children), adults: toCount(adults) };
  const factor = scaleFactor({ children: base.children, adults: base.adults }, target, adultFactor);
  const noOne = target.children + target.adults === 0;
  const isBase = target.children === base.children && target.adults === base.adults;

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-card-sm bg-info p-4 text-info-ink print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="skala-kinder" className="mb-1 block font-bold">
              Kinder
            </label>
            <input
              id="skala-kinder"
              type="number"
              min={0}
              max={500}
              inputMode="numeric"
              value={children}
              onChange={(event) => setChildren(event.target.value)}
              className={`${inputClass} w-28 text-ink`}
            />
          </div>
          <div>
            <label htmlFor="skala-erwachsene" className="mb-1 block font-bold">
              Erwachsene
            </label>
            <input
              id="skala-erwachsene"
              type="number"
              min={0}
              max={500}
              inputMode="numeric"
              value={adults}
              onChange={(event) => setAdults(event.target.value)}
              className={`${inputClass} w-28 text-ink`}
            />
          </div>
        </div>
        <p>
          Das Rezept ist für {base.children} {base.children === 1 ? "Kind" : "Kinder"} und {base.adults}{" "}
          {base.adults === 1 ? "Erwachsenen" : "Erwachsene"} geschrieben
          {isBase ? " (so wie eingegeben)." : "."}
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-display text-2xl font-bold">
          Zutaten für {target.children} {target.children === 1 ? "Kind" : "Kinder"} und {target.adults}{" "}
          {target.adults === 1 ? "Erwachsenen" : "Erwachsene"}
        </h3>
        {noOne && (
          <p role="status" className="rounded-card-sm bg-closed px-4 py-3 text-closed-ink">
            Bitte gib mindestens eine Person ein.
          </p>
        )}
        {lines.length === 0 ? (
          <p className="text-muted">Noch keine Zutaten.</p>
        ) : (
          <ul className="list-none text-[17px] leading-tight">
            {lines.map((line) => (
              <li
                key={line.id}
                className="grid grid-cols-[minmax(5.5rem,auto)_1fr] gap-x-4 border-b border-line-soft py-2 last:border-b-0"
              >
                <span className="text-right font-extrabold">
                  {noOne && line.amount !== null
                    ? "–"
                    : formatAmount(line.amount === null ? null : line.amount * factor, line.unit, "recipe")}
                </span>
                <span>
                  {line.name}
                  {line.archived && <span className="text-muted"> (archiviert)</span>}
                  {line.note && <span className="text-muted">, {line.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

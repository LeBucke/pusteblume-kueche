import { Chip } from "@/components/ui/chip";
import { allergenShort, isAllergenKey } from "@/lib/allergens";

/**
 * Allergene einer Zutat als Chips, dazu der Prüfstatus. Eine ungeprüfte Zutat zeigt nie „keine Allergene“,
 * sondern immer „ungeprüft“ (SPEC 4.3).
 */
export function AllergenChips({ allergens, checked }: { allergens: readonly string[]; checked: boolean }) {
  const keys = allergens.filter(isAllergenKey);

  return (
    <ul className="flex list-none flex-wrap gap-1.5">
      {keys.map((key) => (
        <li key={key}>
          <Chip variant="allergen">{allergenShort(key)}</Chip>
        </li>
      ))}
      {checked && keys.length === 0 && (
        <li>
          <Chip>Keine Allergene</Chip>
        </li>
      )}
      <li>
        {checked ? <Chip variant="info">Geprüft</Chip> : <Chip variant="closed">Allergene ungeprüft</Chip>}
      </li>
    </ul>
  );
}

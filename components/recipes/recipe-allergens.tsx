import { Chip } from "@/components/ui/chip";
import { allergenShort, deriveAllergens } from "@/lib/allergens";

type Ingredient = { name: string; allergens: readonly string[]; allergensChecked: boolean };

/**
 * Abgeleitete Allergene eines Rezepts als Chips (SPEC 4.3). Ist eine Zutat ungeprüft, steht deutlich
 * „Allergenangaben unvollständig“ da, nie „keine Allergene“. Mit `detailed` nennt der Hinweis die Zutaten.
 */
export function RecipeAllergens({
  ingredients,
  detailed = false,
}: {
  ingredients: readonly Ingredient[];
  detailed?: boolean;
}) {
  const { allergens, complete } = deriveAllergens(ingredients);
  const unchecked = [...new Set(ingredients.filter((i) => !i.allergensChecked).map((i) => i.name))];

  return (
    <div className="space-y-2">
      <ul className="flex list-none flex-wrap gap-1.5" aria-label="Allergene">
        {allergens.map((key) => (
          <li key={key}>
            <Chip variant="allergen">{allergenShort(key)}</Chip>
          </li>
        ))}
        {ingredients.length === 0 && (
          <li>
            <Chip variant="closed">Noch keine Zutaten</Chip>
          </li>
        )}
        {ingredients.length > 0 && complete && allergens.length === 0 && (
          <li>
            <Chip>Keine Allergene</Chip>
          </li>
        )}
        {!complete && (
          <li>
            <Chip variant="closed">Allergenangaben unvollständig</Chip>
          </li>
        )}
      </ul>
      {detailed && !complete && (
        <p role="status" className="rounded-card-sm bg-closed px-4 py-3 text-closed-ink">
          Allergenangaben unvollständig: Bei {unchecked.length === 1 ? "dieser Zutat sind" : "diesen Zutaten sind"} die
          Allergene noch ungeprüft ({unchecked.join(", ")}). Die Chips oben zeigen nur, was schon sicher bekannt ist.
        </p>
      )}
    </div>
  );
}

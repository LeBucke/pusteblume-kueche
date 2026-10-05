import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { moveItem, type Direction } from "@/lib/admin";
import type { Database } from "@/lib/database.types";

type SortedTable = "suppliers" | "product_groups";

/** Reihenfolge wie in der Liste: erst nach sort, bei Gleichstand nach Name. */
async function orderedIds(supabase: SupabaseClient<Database>, table: SortedTable): Promise<string[]> {
  const { data } = await supabase.from(table).select("id").order("sort").order("name");
  return (data ?? []).map((row) => row.id);
}

/** sort für einen neuen Eintrag am Ende. */
export async function nextSort(supabase: SupabaseClient<Database>, table: SortedTable): Promise<number> {
  const { data } = await supabase.from(table).select("sort").order("sort", { ascending: false }).limit(1);
  return (data?.[0]?.sort ?? -1) + 1;
}

/** Verschiebt einen Eintrag um einen Platz und nummeriert alle neu durch (0, 1, 2, …). */
export async function moveInOrder(
  supabase: SupabaseClient<Database>,
  table: SortedTable,
  id: string,
  direction: Direction,
): Promise<boolean> {
  const ids = await orderedIds(supabase, table);
  if (!ids.includes(id)) return false;

  const moved = moveItem(ids, id, direction);
  const results = await Promise.all(
    moved.map((itemId, index) => supabase.from(table).update({ sort: index }).eq("id", itemId)),
  );
  return results.every((result) => !result.error);
}

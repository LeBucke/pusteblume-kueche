"use server";

import { revalidatePath } from "next/cache";
import {
  directionSchema,
  firstError,
  idSchema,
  productGroupSchema,
  type ActionState,
} from "@/lib/admin";
import { moveInOrder, nextSort } from "@/lib/admin-sort";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Das hat leider nicht geklappt. Bitte versuche es noch einmal.";
const DUPLICATE_ERROR = "Eine Warengruppe mit diesem Namen gibt es schon.";

function parseGroup(formData: FormData) {
  return productGroupSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    defaultSupplierId: String(formData.get("defaultSupplierId") ?? ""),
  });
}

export async function createProductGroup(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseGroup(formData);
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("product_groups").insert({
    name: parsed.data.name,
    default_supplier_id: parsed.data.defaultSupplierId,
    sort: await nextSort(supabase, "product_groups"),
  });
  if (error) {
    return { status: "error", message: error.code === "23505" ? DUPLICATE_ERROR : GENERIC_ERROR };
  }

  revalidatePath("/admin/warengruppen");
  return { status: "ok", message: `${parsed.data.name} angelegt.` };
}

export async function updateProductGroup(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = idSchema.safeParse(String(formData.get("id") ?? ""));
  const parsed = parseGroup(formData);
  if (!id.success) return { status: "error", message: firstError(id.error) };
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_groups")
    .update({ name: parsed.data.name, default_supplier_id: parsed.data.defaultSupplierId })
    .eq("id", id.data)
    .select("id");
  if (error || !data?.length) {
    return { status: "error", message: error?.code === "23505" ? DUPLICATE_ERROR : GENERIC_ERROR };
  }

  revalidatePath("/admin/warengruppen");
  return { status: "ok", message: "Gespeichert." };
}

export async function moveProductGroup(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = idSchema.safeParse(String(formData.get("id") ?? ""));
  const direction = directionSchema.safeParse(formData.get("direction"));
  if (!id.success || !direction.success) return { status: "error", message: GENERIC_ERROR };

  const supabase = await createClient();
  const ok = await moveInOrder(supabase, "product_groups", id.data, direction.data);
  if (!ok) return { status: "error", message: GENERIC_ERROR };

  revalidatePath("/admin/warengruppen");
  return { status: "ok", message: "Reihenfolge geändert." };
}

/** Löscht nur, wenn keine Zutat die Warengruppe nutzt (archivierte Zutaten zählen mit). */
export async function deleteProductGroup(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = idSchema.safeParse(String(formData.get("id") ?? ""));
  if (!id.success) return { status: "error", message: firstError(id.error) };

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("ingredients")
    .select("id", { count: "exact", head: true })
    .eq("product_group_id", id.data);
  if (countError) return { status: "error", message: GENERIC_ERROR };
  if (count) {
    return {
      status: "error",
      message:
        count === 1
          ? "Diese Warengruppe wird noch von einer Zutat genutzt. Weise der Zutat zuerst eine andere zu."
          : `Diese Warengruppe wird noch von ${count} Zutaten genutzt. Weise den Zutaten zuerst eine andere zu.`,
    };
  }

  const { data, error } = await supabase.from("product_groups").delete().eq("id", id.data).select("id");
  if (error || !data?.length) return { status: "error", message: GENERIC_ERROR };

  revalidatePath("/admin/warengruppen");
  return { status: "ok", message: "Gelöscht." };
}

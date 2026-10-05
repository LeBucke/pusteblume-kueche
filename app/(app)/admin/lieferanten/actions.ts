"use server";

import { revalidatePath } from "next/cache";
import {
  directionSchema,
  firstError,
  idSchema,
  supplierSchema,
  type ActionState,
} from "@/lib/admin";
import { moveInOrder, nextSort } from "@/lib/admin-sort";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Das hat leider nicht geklappt. Bitte versuche es noch einmal.";
const DUPLICATE_ERROR = "Einen Lieferanten mit diesem Namen gibt es schon.";

function parseSupplier(formData: FormData) {
  return supplierSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
}

export async function createSupplier(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseSupplier(formData);
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .insert({ ...parsed.data, sort: await nextSort(supabase, "suppliers") });
  if (error) {
    return { status: "error", message: error.code === "23505" ? DUPLICATE_ERROR : GENERIC_ERROR };
  }

  revalidatePath("/admin/lieferanten");
  return { status: "ok", message: `${parsed.data.name} angelegt.` };
}

export async function updateSupplier(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = idSchema.safeParse(String(formData.get("id") ?? ""));
  const parsed = parseSupplier(formData);
  if (!id.success) return { status: "error", message: firstError(id.error) };
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("suppliers").update(parsed.data).eq("id", id.data).select("id");
  if (error || !data?.length) {
    return { status: "error", message: error?.code === "23505" ? DUPLICATE_ERROR : GENERIC_ERROR };
  }

  revalidatePath("/admin/lieferanten");
  return { status: "ok", message: "Gespeichert." };
}

export async function moveSupplier(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = idSchema.safeParse(String(formData.get("id") ?? ""));
  const direction = directionSchema.safeParse(formData.get("direction"));
  if (!id.success || !direction.success) return { status: "error", message: GENERIC_ERROR };

  const supabase = await createClient();
  const ok = await moveInOrder(supabase, "suppliers", id.data, direction.data);
  if (!ok) return { status: "error", message: GENERIC_ERROR };

  revalidatePath("/admin/lieferanten");
  return { status: "ok", message: "Reihenfolge geändert." };
}

"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "manager") throw new Error("Accès refusé.");
  return session.user as any;
}

export async function addAccessRule(formData: FormData) {
  await requireManager();

  const documentId = formData.get("documentId") as string;
  const scopeType = formData.get("scopeType") as string;
  const scopeId = formData.get("scopeId") as string;
  const access = formData.get("access") as string;

  if (!documentId || !scopeType || !scopeId || !access) {
    throw new Error("Tous les champs sont requis.");
  }

  const { error } = await supabaseAdmin.from("document_access_rules").insert({
    document_id: documentId,
    scope_type: scopeType,
    scope_id: scopeId,
    access,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/library");
}

export async function removeAccessRule(ruleId: string) {
  await requireManager();

  const { error } = await supabaseAdmin
    .from("document_access_rules")
    .delete()
    .eq("id", ruleId);

  if (error) throw new Error(error.message);

  revalidatePath("/library");
}

export async function toggleGroupWide(documentId: string, isGroupWide: boolean) {
  await requireManager();

  const { error } = await supabaseAdmin
    .from("documents")
    .update({ is_group_wide: isGroupWide })
    .eq("id", documentId);

  if (error) throw new Error(error.message);

  revalidatePath("/library");
}
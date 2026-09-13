"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const role = (session.user as any).role;
  if (role !== "admin" && role !== "manager") {
    throw new Error("Action réservée aux administrateurs et managers.");
  }

  const companyId = (session.user as any).companyId;
  const userId = (session.user as any).id;

  const title = formData.get("title") as string;
  const service = formData.get("service") as string;
  const visibilityRoles = formData.getAll("visibility_roles") as string[];
  const dateRevision = formData.get("date_revision") as string;
  const file = formData.get("file") as File | null;

  if (!title || visibilityRoles.length === 0) {
    throw new Error("Titre et rôles de visibilité requis.");
  }
  if (!file || file.size === 0) {
    throw new Error("Fichier requis.");
  }

  const filePath = `${companyId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) throw new Error(uploadError.message);

  const { data: newDoc, error: insertError } = await supabaseAdmin
    .from("documents")
    .insert({
      company_id: companyId,
      service,
      owner_id: userId,
      title,
      visibility_roles: visibilityRoles,
      status: "draft",
      date_revision: dateRevision || null,
      file_path: filePath,
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  await supabaseAdmin.from("document_versions").insert({
    document_id: newDoc.id,
    version: 1,
    file_path: filePath,
    extraction_status: "pending",
  });

  revalidatePath("/library");
}

export async function publishDocument(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const role = (session.user as any).role;
  if (role !== "admin" && role !== "manager") {
    throw new Error("Action réservée aux administrateurs et managers.");
  }

  const companyId = (session.user as any).companyId;

  const { data: document, error: fetchError } = await supabaseAdmin
    .from("documents")
    .select("id, company_id, extraction_status")
    .eq("id", documentId)
    .single();

  if (fetchError || !document) throw new Error("Document introuvable.");
  if (document.company_id !== companyId) throw new Error("Accès refusé.");
  if (document.extraction_status !== "ok") {
    throw new Error("Impossible de publier : extraction non réussie.");
  }

  const { error } = await supabaseAdmin
    .from("documents")
    .update({ status: "published" })
    .eq("id", documentId);

  if (error) throw new Error(error.message);

  revalidatePath("/library");
}

export async function deleteDocument(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const role = (session.user as any).role;
  if (role !== "admin" && role !== "manager") {
    throw new Error("Action réservée aux administrateurs et managers.");
  }

  const companyId = (session.user as any).companyId;

  const { data: document, error: fetchError } = await supabaseAdmin
    .from("documents")
    .select("id, company_id")
    .eq("id", documentId)
    .single();

  if (fetchError || !document) throw new Error("Document introuvable.");
  if (document.company_id !== companyId) throw new Error("Accès refusé.");

  await supabaseAdmin
    .from("document_chunks")
    .update({ is_active: false })
    .eq("document_id", documentId);

  await supabaseAdmin
    .from("documents")
    .update({ status: "archived" })
    .eq("id", documentId);

  revalidatePath("/library");
}

export async function reuploadDocument(documentId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const role = (session.user as any).role;
  if (role !== "admin" && role !== "manager") {
    throw new Error("Action réservée aux administrateurs et managers.");
  }

  const companyId = (session.user as any).companyId;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) throw new Error("Fichier requis.");

  const { data: document, error: fetchError } = await supabaseAdmin
    .from("documents")
    .select("id, company_id, version")
    .eq("id", documentId)
    .single();

  if (fetchError || !document) throw new Error("Document introuvable.");
  if (document.company_id !== companyId) throw new Error("Accès refusé.");

  const newVersion = document.version + 1;
  const filePath = `${companyId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) throw new Error(uploadError.message);

  // Désactive les chunks de l'ancienne version — historique conservé, pas supprimé
  await supabaseAdmin
    .from("document_chunks")
    .update({ is_active: false })
    .eq("document_id", documentId);

  const { error: updateError } = await supabaseAdmin
    .from("documents")
    .update({
      version: newVersion,
      file_path: filePath,
      status: "draft",
      extraction_status: "pending",
    })
    .eq("id", documentId);

  if (updateError) throw new Error(updateError.message);

  await supabaseAdmin.from("document_versions").insert({
    document_id: documentId,
    version: newVersion,
    file_path: filePath,
    extraction_status: "pending",
  });

  revalidatePath("/library");
}

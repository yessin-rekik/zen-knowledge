"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

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

  const { error: insertError } = await supabaseAdmin.from("documents").insert({
    company_id: companyId,
    service,
    owner_id: userId,
    title,
    visibility_roles: visibilityRoles,
    status: "draft",
    date_revision: dateRevision || null,
    file_path: filePath,
  });

  if (insertError) throw new Error(insertError.message);

  revalidatePath("/library");
}
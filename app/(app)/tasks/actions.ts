"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function completeTask(taskId: string, newRevisionDate: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const userId = (session.user as any).id;

  const { data: task, error: fetchError } = await supabaseAdmin
    .from("tasks")
    .select("id, owner_id, document_id")
    .eq("id", taskId)
    .single();

  if (fetchError || !task) throw new Error("Tâche introuvable.");
  if (task.owner_id !== userId) throw new Error("Accès refusé.");

  if (!newRevisionDate) {
    throw new Error("Nouvelle date de révision requise.");
  }

  // Met à jour la date de révision du document et le republie s'il avait été dépublié
  await supabaseAdmin
    .from("documents")
    .update({ date_revision: newRevisionDate, status: "published" })
    .eq("id", task.document_id);

  await supabaseAdmin
    .from("document_chunks")
    .update({ is_active: true })
    .eq("document_id", task.document_id);

  await supabaseAdmin.from("tasks").update({ status: "done" }).eq("id", taskId);

  revalidatePath("/tasks");
  revalidatePath("/library");
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Vercel Cron envoie un header d'autorisation qu'on vérifie en prod
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = new Date();

  // 1. Documents publiés dont date_revision est dépassée ET qui n'ont pas encore de tâche ouverte
  const { data: overdueDocuments, error: fetchError } = await supabaseAdmin
    .from("documents")
    .select("id, owner_id, date_revision")
    .eq("status", "published")
    .lt("date_revision", now.toISOString());

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let tasksCreated = 0;

  for (const doc of overdueDocuments ?? []) {
    const { data: existingTask } = await supabaseAdmin
      .from("tasks")
      .select("id")
      .eq("document_id", doc.id)
      .eq("status", "pending")
      .maybeSingle();

    if (!existingTask) {
      await supabaseAdmin.from("tasks").insert({
        document_id: doc.id,
        owner_id: doc.owner_id,
        type: "revision_needed",
        status: "pending",
        due_at: now.toISOString(),
      });
      tasksCreated++;
    }
  }

  // 2. Relance J+7 : tâches pending créées il y a plus de 7 jours, pas encore relancées
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: staleTasks } = await supabaseAdmin
    .from("tasks")
    .select("id, document_id, due_at")
    .eq("status", "pending")
    .eq("type", "revision_needed")
    .lt("due_at", sevenDaysAgo.toISOString());

  let remindersSent = 0;
  for (const task of staleTasks ?? []) {
    // On marque la relance en changeant le type pour éviter de la renvoyer en boucle
    await supabaseAdmin
      .from("tasks")
      .update({ type: "revision_needed_reminded" })
      .eq("id", task.id);
    remindersSent++;
    // Email optionnel : pas implémenté ici (hors scope 48h), log suffisant pour la démo
  }

  // 3. Dépublication J+14 : tâches créées il y a plus de 14 jours, toujours pending (peu importe si relancées)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const { data: expiredTasks } = await supabaseAdmin
    .from("tasks")
    .select("id, document_id")
    .in("status", ["pending"])
    .in("type", ["revision_needed", "revision_needed_reminded"])
    .lt("due_at", fourteenDaysAgo.toISOString());

  let documentsUnpublished = 0;
  for (const task of expiredTasks ?? []) {
    await supabaseAdmin
      .from("documents")
      .update({ status: "archived" })
      .eq("id", task.document_id);

    await supabaseAdmin
      .from("document_chunks")
      .update({ is_active: false })
      .eq("document_id", task.document_id);

    await supabaseAdmin
      .from("tasks")
      .update({ status: "done" })
      .eq("id", task.id);

    documentsUnpublished++;
  }

  return NextResponse.json({
    tasksCreated,
    checked: overdueDocuments?.length ?? 0,
    remindersSent,
    documentsUnpublished,
  });
}

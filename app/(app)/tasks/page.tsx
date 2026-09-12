import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { CompleteTaskButton } from "./complete-task-button";

export const metadata = {
  title: "Mes tâches",
};

export default async function TasksPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("id, type, status, due_at, documents(id, title)")
    .eq("owner_id", userId)
    .neq("status", "done")
    .order("due_at", { ascending: true });

  const typeLabels: Record<string, string> = {
    revision_needed: "Révision requise",
    revision_needed_reminded: "Révision requise (relancée)",
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <h1>Mes tâches</h1>

        {(!tasks || tasks.length === 0) && (
          <p className="text-sm text-[#6B695E] py-8 text-center">
            Aucune tâche en attente.
          </p>
        )}

        <ul className="divide-y divide-[#D6D2CB]">
          {tasks?.map((task: any) => (
            <li key={task.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-[#1C2321]">
                  {task.documents?.title ?? "Document supprimé"}
                </p>
                <p className="text-xs text-[#6B695E]">
                  {typeLabels[task.type] ?? task.type} — échéance{" "}
                  {new Date(task.due_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <CompleteTaskButton taskId={task.id} documentId={task.documents?.id} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
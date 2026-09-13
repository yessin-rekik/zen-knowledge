import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { CompleteTaskButton } from "./complete-task-button";
import { ListTodo } from "lucide-react";

export const metadata = {
  title: "Mes tâches",
};

const typeLabels: Record<string, string> = {
  revision_needed: "Révision requise",
  revision_needed_reminded: "Révision requise (relancée)",
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-baseline justify-between">
          <h1>Mes tâches</h1>
          {tasks && tasks.length > 0 && (
            <span className="text-xs text-[#6B695E]">
              {tasks.length} tâche{tasks.length !== 1 ? "s" : ""} en attente
            </span>
          )}
        </div>

        {(!tasks || tasks.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#D6D2CB] rounded-lg">
            <ListTodo size={28} strokeWidth={1.5} className="text-[#6B695E]/40 mb-2" aria-hidden="true" />
            <p className="text-sm text-[#6B695E]">Aucune tâche en attente.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#D6D2CB] rounded-lg border border-[#D6D2CB] bg-white overflow-hidden">
            {tasks.map((task: any) => {
              const isOverdue = new Date(task.due_at) < new Date();
              return (
                <li key={task.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1C2321] truncate">
                      {task.documents?.title ?? "Document supprimé"}
                    </p>
                    <p className={`text-xs ${isOverdue ? "text-[#B54A45]" : "text-[#6B695E]"}`}>
                      {typeLabels[task.type] ?? task.type} — échéance{" "}
                      {new Date(task.due_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <CompleteTaskButton taskId={task.id} documentId={task.documents?.id} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
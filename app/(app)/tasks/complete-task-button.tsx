"use client";

import { useState } from "react";
import { completeTask } from "./actions";

export function CompleteTaskButton({
  taskId,
  documentId,
}: {
  taskId: string;
  documentId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!documentId) {
    return <span className="text-xs text-[#6B695E]">Document supprimé</span>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await completeTask(taskId, date);
      setOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 rounded text-xs font-medium border border-[#2D5D53] text-[#2D5D53] hover:bg-[#EEF2F0]"
      >
        Marquer révisé
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        className="px-2 py-1 rounded border border-[#D6D2CB] text-xs"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-2.5 py-1 rounded text-xs font-medium bg-[#2D5D53] text-[#F7F5F0] disabled:opacity-50"
      >
        {loading ? "..." : "Confirmer"}
      </button>
      {error && <p className="text-xs text-[#B54A45]">{error}</p>}
    </form>
  );
}
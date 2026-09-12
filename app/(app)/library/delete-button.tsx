"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  documentId,
  documentTitle,
  deleteAction,
}: {
  documentId: string;
  documentTitle: string;
  deleteAction: (id: string) => Promise<void>;
}) {
  return (
    <form action={deleteAction.bind(null, documentId)}>
      <button
        type="submit"
        aria-label={`Supprimer ${documentTitle}`}
        className="
          flex items-center justify-center
          w-7 h-7 rounded
          text-[#6B695E]
          hover:bg-[#FAEAEA] hover:text-[#B54A45]
          zen-transition
          focus-visible:outline-2 focus-visible:outline-[#B54A45] focus-visible:outline-offset-1
        "
        onClick={(e) => {
          if (!window.confirm(`Supprimer définitivement "${documentTitle}" ?`)) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  );
}
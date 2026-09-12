"use client";

import { Plus } from "lucide-react";

export function AddDocumentToggle() {
  const handleClick = () => {
    const panel = document.getElementById("add-doc-panel") as HTMLDetailsElement | null;
    if (panel) {
      panel.open = true;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="
        flex items-center gap-1.5
        px-3 py-2 rounded-md cursor-pointer
        text-sm font-medium
        bg-[#2D5D53] text-[#F7F5F0]
        hover:bg-[#245048]
        zen-transition
      "
    >
      <Plus size={14} strokeWidth={2} aria-hidden="true" />
      Ajouter un document
    </button>
  );
}
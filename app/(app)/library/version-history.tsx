"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Version {
  id: string;
  version: number;
  extraction_status: string | null;
  created_at: string;
}

export function VersionHistory({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [loading, setLoading] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = async () => {
    if (!open && !versions) {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/versions`);
      const data = await res.json();
      setVersions(data.versions ?? []);
      setLoading(false);
    }
    setOpen((v) => !v);
  };

  const openVersion = async (versionId: string) => {
    const res = await fetch(
      `/api/documents/${documentId}/url?versionId=${versionId}`,
    );
    const data = await res.json();
    if (!res.ok) {
      alert(`Erreur : ${data.error}`);
      return;
    }
    window.open(data.url, "_blank");
  };

  return (
    <div className="mt-1">
      <button
        ref={btnRef}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`versions-${documentId}`}
        className="
          text-[11px] text-[#6B695E] hover:text-[#2D5D53]
          underline underline-offset-2 decoration-[#D6D2CB]
          hover:decoration-[#2D5D53]
          zen-transition
          focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1 rounded
        "
      >
        {open ? "Masquer l'historique" : "Historique des versions"}
      </button>

      {open && (
        <div
          id={`versions-${documentId}`}
          role="list"
          className="mt-2 border-l-2 border-[#D6D2CB] pl-3 space-y-1"
        >
          {loading && (
            <p className="text-[11px] text-[#6B695E]">Chargement…</p>
          )}
          {!loading && versions?.length === 0 && (
            <p className="text-[11px] text-[#6B695E]">Aucune version antérieure</p>
          )}
          {versions?.map((v) => (
            <div key={v.id} role="listitem" className="flex items-baseline gap-2">
              <button
                onClick={() => openVersion(v.id)}
                className="
                  text-[11px] text-[#6B695E] hover:text-[#2D5D53]
                  zen-transition
                  focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1 rounded
                "
              >
                <span className="font-medium">v{v.version}</span>
                {" — "}
                {new Date(v.created_at).toLocaleDateString("fr-FR")}
              </button>
              {v.extraction_status && v.extraction_status !== "ok" && (
                <span className="text-[10px] text-[#C08A3E]">
                  {v.extraction_status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
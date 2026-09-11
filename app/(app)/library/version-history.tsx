"use client";

import { useState } from "react";

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

  const toggle = async () => {
    if (!open && !versions) {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/versions`);
      const data = await res.json();
      setVersions(data.versions ?? []);
      setLoading(false);
    }
    setOpen(!open);
  };

  const openVersion = async (versionId: string) => {
    const res = await fetch(`/api/documents/${documentId}/url?versionId=${versionId}`);
    const data = await res.json();
    if (!res.ok) {
      alert(`Erreur: ${data.error}`);
      return;
    }
    window.open(data.url, "_blank");
  };

  return (
    <div className="text-xs">
      <button onClick={toggle} className="underline text-gray-500">
        {open ? "Masquer versions" : "Historique versions"}
      </button>
      {open && (
        <div className="mt-1 space-y-1 border-l pl-2">
          {loading && <p>Chargement...</p>}
          {versions?.map((v) => (
            <button
              key={v.id}
              onClick={() => openVersion(v.id)}
              className="block text-left hover:text-blue-600"
            >
              v{v.version} — {v.extraction_status ?? "pending"} —{" "}
              {new Date(v.created_at).toLocaleDateString()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
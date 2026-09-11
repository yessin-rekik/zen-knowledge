"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExtractButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult(`Erreur: ${data.error}`);
      return;
    }

    setResult(`Statut: ${data.status} (${data.textLength} caractères)`);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-gray-200 px-3 py-1 text-sm"
      >
        {loading ? "Extraction..." : "Extraire"}
      </button>
      {result && <p className="text-xs text-gray-500">{result}</p>}
    </div>
  );
}
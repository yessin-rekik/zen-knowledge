"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function ExtractButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

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
      setResult({ ok: false, message: data.error ?? "Erreur inconnue" });
      return;
    }

    setResult({
      ok: true,
      message: `${data.textLength ?? 0} caractères indexés`,
    });
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={loading ? "Extraction en cours" : "Lancer l'extraction"}
        className="
          flex items-center gap-1.5
          px-2.5 py-1 rounded
          text-xs font-medium
          border border-[#D6D2CB]
          text-[#6B695E] bg-transparent
          hover:border-[#2D5D53] hover:text-[#2D5D53]
          disabled:opacity-50 disabled:cursor-not-allowed
          zen-transition
          focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1
        "
      >
        {loading ? (
          <>
            <Loader2
              size={11}
              strokeWidth={2}
              className="animate-spin"
              aria-hidden="true"
            />
            Extraction…
          </>
        ) : (
          "Extraire"
        )}
      </button>

      {result && (
        <p
          className={`flex items-center gap-1 text-[10px] ${
            result.ok ? "text-[#2D5D53]" : "text-[#B54A45]"
          }`}
          role="status"
          aria-live="polite"
        >
          {result.ok ? (
            <CheckCircle size={10} strokeWidth={2} aria-hidden="true" />
          ) : (
            <AlertCircle size={10} strokeWidth={2} aria-hidden="true" />
          )}
          {result.message}
        </p>
      )}
    </div>
  );
}
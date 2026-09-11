"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

interface ReuploadFormProps {
  documentId: string;
  documentTitle: string;
  reuploadAction: (id: string, formData: FormData) => Promise<void>;
}

export function ReuploadForm({
  documentId,
  documentTitle,
  reuploadAction,
}: ReuploadFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !formRef.current) return;
    const formData = new FormData(formRef.current);
    await reuploadAction(documentId, formData);
    router.refresh();
    /* Réinitialise l'input pour permettre un re-dépôt */
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <form ref={formRef} className="contents">
      <label
        htmlFor={`reupload-${documentId}`}
        className="
          flex items-center gap-1 cursor-pointer
          px-2.5 py-1 rounded text-xs
          border border-[#D6D2CB]
          text-[#6B695E] bg-transparent
          hover:border-[#2D5D53] hover:text-[#2D5D53]
          zen-transition
        "
        title={`Déposer une nouvelle version pour ${documentTitle}`}
      >
        <Upload size={11} strokeWidth={2} aria-hidden="true" />
        <span>Version</span>
      </label>
      <input
        ref={inputRef}
        id={`reupload-${documentId}`}
        type="file"
        name="file"
        accept=".pdf"
        required
        className="sr-only"
        aria-label={`Nouvelle version pour ${documentTitle}`}
        onChange={handleChange}
      />
    </form>
  );
}

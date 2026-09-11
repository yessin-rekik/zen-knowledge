"use client";

import { useState } from "react";
import { Upload, FileText, Calendar } from "lucide-react";

export function CustomFileInput({
  name,
  accept,
  required,
}: {
  name: string;
  accept?: string;
  required?: boolean;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="relative">
      <input
        id={`file-input-${name}`}
        type="file"
        name={name}
        accept={accept}
        required={required}
        // Opacity 0 and absolute inset-0 keeps it clickable and focusable
        // for HTML5 validation without breaking layout
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
          } else {
            setFileName(null);
          }
        }}
        // Title empty string prevents the native tooltip "No file chosen"
        title=""
      />
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md
          border border-[#D6D2CB] bg-white
          text-sm pointer-events-none
          transition-colors
          ${fileName ? "text-[#1C2321]" : "text-[#6B695E]/60"}
        `}
      >
        {fileName ? (
          <FileText size={16} className="text-[#2D5D53] shrink-0" strokeWidth={1.75} />
        ) : (
          <Upload size={16} className="shrink-0" strokeWidth={1.75} />
        )}
        <span className="truncate">{fileName ?? "Sélectionner un fichier PDF…"}</span>
      </div>
    </div>
  );
}

export function CustomDateInput({ name }: { name: string }) {
  const [val, setVal] = useState("");

  return (
    <div className="relative">
      <input
        type="date"
        name={name}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="
          w-full px-3 py-2 pl-9 rounded-md
          border border-[#D6D2CB]
          text-sm text-[#1C2321]
          bg-white
          focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-0
          [&::-webkit-calendar-picker-indicator]:opacity-0
          [&::-webkit-calendar-picker-indicator]:absolute
          [&::-webkit-calendar-picker-indicator]:inset-0
          [&::-webkit-calendar-picker-indicator]:w-full
          [&::-webkit-calendar-picker-indicator]:h-full
          [&::-webkit-calendar-picker-indicator]:cursor-pointer
        "
        style={{
          // Masque le texte natif "mm/dd/yyyy" quand vide sur les navigateurs webkit
          color: val ? "inherit" : "transparent",
        }}
      />
      {!val && (
        <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-[#6B695E]/60 pointer-events-none">
          JJ/MM/AAAA
        </span>
      )}
      <Calendar
        size={16}
        strokeWidth={1.75}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B695E] pointer-events-none"
      />
    </div>
  );
}

"use client";

import { leaveCompanyContext } from "./actions";
import { Building2 } from "lucide-react";

export function LeaveContextButton() {
  return (
    <form action={leaveCompanyContext}>
      <button
        type="submit"
        className="
          flex items-center justify-center sm:justify-start gap-2.5 w-full
          px-0 sm:px-3 py-2 rounded-md
          text-sm text-[#6B695E]
          hover:text-[#1C2321] hover:bg-white/50
          zen-transition
        "
      >
        <Building2 size={16} strokeWidth={1.75} aria-hidden="true" />
        <span className="hidden sm:inline">Quitter la société</span>
      </button>
    </form>
  );
}
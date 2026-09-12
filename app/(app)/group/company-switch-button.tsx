"use client";

import { switchActiveCompany } from "./actions";

export function CompanySwitchButton({ companyId, isActive }: { companyId: string; isActive: boolean }) {
  if (isActive) {
    return <span className="text-xs text-[#6B695E]">Contexte actuel</span>;
  }

  return (
    <form action={switchActiveCompany.bind(null, companyId)}>
      <button
        type="submit"
        className="px-2.5 py-1 rounded text-xs font-medium border border-[#2D5D53] text-[#2D5D53] hover:bg-[#EEF2F0]"
      >
        Basculer
      </button>
    </form>
  );
}
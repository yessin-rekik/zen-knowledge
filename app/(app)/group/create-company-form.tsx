"use client";

import { useState } from "react";
import { createCompany } from "./actions";

export function CreateCompanyForm() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    try {
      await createCompany(formData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form action={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1 space-y-1.5">
        <label htmlFor="company-name" className="block text-sm font-medium text-[#1C2321]">
          Nouvelle société
        </label>
        <input
          id="company-name"
          name="name"
          required
          className="w-full px-3 py-2 rounded-md border border-[#D6D2CB] text-sm bg-white"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 rounded-md text-sm font-medium bg-[#2D5D53] text-[#F7F5F0] hover:bg-[#245048]"
      >
        Créer
      </button>
      {error && <p className="text-sm text-[#B54A45]">{error}</p>}
    </form>
  );
}
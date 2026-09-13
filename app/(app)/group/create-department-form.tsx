"use client";

import { useState } from "react";
import { createDepartment } from "./actions";

export function CreateDepartmentForm({ companies }: { companies: { id: string; name: string }[] }) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    try {
      await createDepartment(formData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-3 border border-[#D6D2CB] rounded-lg p-5">
      <h2>Ajouter un département</h2>
      <div className="flex gap-2 items-end">
        <div className="space-y-1.5">
          <label htmlFor="dept-company" className="block text-sm font-medium text-[#1C2321]">
            Société
          </label>
          <select
            id="dept-company"
            name="companyId"
            required
            className="px-3 py-2 rounded-md border border-[#D6D2CB] text-sm bg-white"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="dept-name" className="block text-sm font-medium text-[#1C2321]">
            Nom du département
          </label>
          <input
            id="dept-name"
            name="name"
            required
            className="w-full px-3 py-2 rounded-md border border-[#D6D2CB] text-sm bg-white"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-md text-sm font-medium bg-[#2D5D53] text-[#F7F5F0] hover:bg-[#245048]"
        >
          Ajouter
        </button>
      </div>
      {error && <p className="text-sm text-[#B54A45]">{error}</p>}
    </form>
  );
}
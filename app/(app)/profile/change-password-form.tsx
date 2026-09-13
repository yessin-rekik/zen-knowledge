"use client";

import { useState } from "react";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await changePassword(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4 border border-[#D6D2CB] rounded-lg p-5">
      <h2>Changer de mot de passe</h2>

      <div className="space-y-1.5">
        <label htmlFor="currentPassword" className="block text-sm font-medium text-[#1C2321]">
          Mot de passe actuel
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="w-full px-3 py-2 rounded-md border border-[#D6D2CB] text-sm bg-white"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="newPassword" className="block text-sm font-medium text-[#1C2321]">
          Nouveau mot de passe
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="w-full px-3 py-2 rounded-md border border-[#D6D2CB] text-sm bg-white"
        />
      </div>

      {error && <p className="text-sm text-[#B54A45]">{error}</p>}
      {success && <p className="text-sm text-[#2D5D53]">Mot de passe mis à jour avec succès.</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-md text-sm font-medium bg-[#2D5D53] text-[#F7F5F0] hover:bg-[#245048] disabled:opacity-50"
      >
        {loading ? "..." : "Mettre à jour"}
      </button>
    </form>
  );
}
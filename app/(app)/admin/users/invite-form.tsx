"use client";

import { useState } from "react";
import { inviteCollaborator } from "../users-actions";

export function InviteForm() {
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setTempPassword(null);
    setLoading(true);

    try {
      const result = await inviteCollaborator(formData);
      setTempPassword(result.tempPassword);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#D6D2CB] bg-white rounded-lg p-5 space-y-4">
      <h2>Inviter un collaborateur</h2>

      <form action={handleSubmit} className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label htmlFor="invite-email" className="block text-sm font-medium text-[#1C2321]">
            Email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 rounded-md border border-[#D6D2CB] text-sm bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="invite-role" className="block text-sm font-medium text-[#1C2321]">
            Rôle
          </label>
          <select
            id="invite-role"
            name="role"
            defaultValue="employee"
            className="px-3 py-2 rounded-md border border-[#D6D2CB] text-sm bg-white"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md text-sm font-medium bg-[#2D5D53] text-[#F7F5F0] hover:bg-[#245048] disabled:opacity-50"
        >
          {loading ? "Envoi..." : "Inviter"}
        </button>
      </form>

      {error && <p className="text-sm text-[#B54A45]">{error}</p>}

      {tempPassword && (
        <div className="bg-[#FBF4E9] border border-[#C08A3E]/30 rounded-md p-3 text-sm">
          <p className="text-[#1C2321]">
            Collaborateur créé. Mot de passe temporaire (à communiquer manuellement, affiché une seule fois) :
          </p>
          <code className="block mt-1 font-mono text-[#C08A3E] font-medium">{tempPassword}</code>
        </div>
      )}
    </div>
  );
}
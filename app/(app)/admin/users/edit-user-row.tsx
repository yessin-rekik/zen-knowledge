"use client";

import { useState } from "react";
import { updateCollaboratorEmail, resetCollaboratorPassword } from "../users-actions";
import { DeactivateUserButton } from "./deactivate-button";

export function EditUserRow({
  userId,
  email,
  role,
  isSelf,
}: {
  userId: string;
  email: string;
  role: string;
  isSelf: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveEmail = async () => {
    setError(null);
    setLoading(true);
    try {
      await updateCollaboratorEmail(userId, newEmail);
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm(`Régénérer le mot de passe de ${email} ?`)) return;
    setError(null);
    setLoading(true);
    try {
      const result = await resetCollaboratorPassword(userId);
      setTempPassword(result.tempPassword);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-2 py-1 rounded border border-[#D6D2CB] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#1C2321] truncate">{email}</p>
          )}
          <p className="text-xs text-[#6B695E] capitalize">{role}</p>
        </div>

        {!isSelf && (
          <div className="flex items-center gap-2 shrink-0 text-xs">
            {editing ? (
              <>
                <button
                  onClick={handleSaveEmail}
                  disabled={loading}
                  className="text-[#2D5D53] hover:underline"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setNewEmail(email);
                  }}
                  className="text-[#6B695E] hover:underline"
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-[#6B695E] hover:text-[#1C2321] hover:underline"
                >
                  Modifier email
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="text-[#6B695E] hover:text-[#1C2321] hover:underline"
                >
                  Réinitialiser mdp
                </button>
                <DeactivateUserButton userId={userId} email={email} />
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-[#B54A45]">{error}</p>}

      {tempPassword && (
        <div className="bg-[#FBF4E9] border border-[#C08A3E]/30 rounded-md p-2 text-xs">
          Nouveau mot de passe temporaire :{" "}
          <code className="font-mono text-[#C08A3E] font-medium">{tempPassword}</code>
        </div>
      )}
    </li>
  );
}
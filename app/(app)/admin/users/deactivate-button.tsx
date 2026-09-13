"use client";

import { deactivateCollaborator } from "../users-actions";

export function DeactivateUserButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  return (
    <form
      action={async () => { await deactivateCollaborator(userId); }}
    >
      <button
        type="submit"
        className="text-xs text-[#6B695E] hover:text-[#B54A45] underline"
        onClick={(e) => {
          if (!window.confirm(`Désactiver l'accès de ${email} ?`)) {
            e.preventDefault();
          }
        }}
      >
        Désactiver
      </button>
    </form>
  );
}

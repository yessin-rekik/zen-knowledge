"use client";

import { useState } from "react";
import { addAccessRule, removeAccessRule, toggleGroupWide } from "./access-rules-actions";

interface AccessRule {
  id: string;
  scope_type: "company" | "user";
  scope_id: string;
  access: "allow" | "deny";
}

export function AccessRulesPanel({
  documentId,
  isGroupWide,
  rules,
  companies,
  users,
}: {
  documentId: string;
  isGroupWide: boolean;
  rules: AccessRule[];
  companies: { id: string; name: string }[];
  users: { id: string; email: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupWide, setGroupWide] = useState(isGroupWide);
  const [scopeType, setScopeType] = useState<"company" | "user">("company");

  const handleAddRule = async (formData: FormData) => {
    setError(null);
    try {
      await addAccessRule(formData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleGroupWide = async () => {
    const next = !groupWide;
    setGroupWide(next);
    try {
      await toggleGroupWide(documentId, next);
    } catch (err: any) {
      setError(err.message);
      setGroupWide(!next);
    }
  };

  const scopeLabel = (rule: AccessRule) => {
    if (rule.scope_type === "company") {
      return companies.find((c) => c.id === rule.scope_id)?.name ?? rule.scope_id;
    }
    return users.find((u) => u.id === rule.scope_id)?.email ?? rule.scope_id;
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-[#6B695E] underline">
        Permissions avancées
      </button>
    );
  }

  return (
    <div className="border border-[#D6D2CB] rounded-md p-3 space-y-3 text-xs">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={groupWide}
          onChange={handleToggleGroupWide}
          className="accent-[#2D5D53]"
        />
        Visible à tout le Groupe (toutes les sociétés)
      </label>

      <div>
        <p className="font-medium text-[#1C2321] mb-1">Règles d'exception</p>
        {rules.length === 0 && <p className="text-[#6B695E]">Aucune règle.</p>}
        <ul className="space-y-1">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between">
              <span>
                {rule.access === "allow" ? "Autoriser" : "Refuser"} —{" "}
                {rule.scope_type === "company" ? "Société" : "Utilisateur"} : {scopeLabel(rule)}
              </span>
              <button
                onClick={() => removeAccessRule(rule.id)}
                className="text-[#B54A45] hover:underline"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      </div>

      <form action={handleAddRule} className="flex flex-wrap gap-1.5 items-end">
        <input type="hidden" name="documentId" value={documentId} />
        <select
          name="scopeType"
          value={scopeType}
          onChange={(e) => setScopeType(e.target.value as "company" | "user")}
          className="px-2 py-1 rounded border border-[#D6D2CB]"
        >
          <option value="company">Société</option>
          <option value="user">Utilisateur</option>
        </select>
        <select name="scopeId" required className="px-2 py-1 rounded border border-[#D6D2CB] max-w-[140px]">
          {scopeType === "company"
            ? companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            : users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
        </select>
        <select name="access" className="px-2 py-1 rounded border border-[#D6D2CB]">
          <option value="allow">Autoriser</option>
          <option value="deny">Refuser</option>
        </select>
        <button type="submit" className="px-2 py-1 rounded bg-[#2D5D53] text-[#F7F5F0]">
          Ajouter
        </button>
      </form>

      {error && <p className="text-[#B54A45]">{error}</p>}

      <button onClick={() => setOpen(false)} className="text-[#6B695E] underline">
        Fermer
      </button>
    </div>
  );
}
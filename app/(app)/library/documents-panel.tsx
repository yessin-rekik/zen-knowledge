"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { DocumentRow } from "./document-row";

interface Doc {
  id: string;
  title: string;
  service: string | null;
  status: string;
  version: number;
  visibility_roles: string[];
  date_revision: string | null;
  extraction_status: string | null;
  is_group_wide: boolean;
}

export function DocumentsPanel({
  documents,
  canManage,
  rulesByDocument,
  companies,
  users,
}: {
  documents: Doc[];
  canManage: boolean;
  rulesByDocument: Record<string, any[]>;
  companies: { id: string; name: string }[];
  users: { id: string; email: string }[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"title" | "revision">("title");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    let result = documents.filter((d) => {
      const matchesSearch =
        !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.service ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      if (sortOrder === "title") return a.title.localeCompare(b.title);
      const aDate = a.date_revision ? new Date(a.date_revision).getTime() : Infinity;
      const bDate = b.date_revision ? new Date(b.date_revision).getTime() : Infinity;
      return aDate - bDate;
    });

    return result;
  }, [documents, search, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B695E]" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un document..."
            className="w-full pl-7 pr-2 py-1.5 rounded-md border border-[#D6D2CB] text-xs bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-2 py-1.5 rounded-md border border-[#D6D2CB] text-xs bg-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
          <option value="archived">Archivé</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "title" | "revision")}
          className="px-2 py-1.5 rounded-md border border-[#D6D2CB] text-xs bg-white"
        >
          <option value="title">Trier par titre</option>
          <option value="revision">Trier par date de révision</option>
        </select>
        {(search || statusFilter !== "all") && (
          <button onClick={resetFilters} className="text-xs text-[#6B695E] underline px-1">
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#6B695E] py-8 text-center">Aucun document ne correspond.</p>
      ) : (
        <>
          <ul className="divide-y divide-[#D6D2CB]" role="list">
            {paginated.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                canManage={canManage}
                rules={rulesByDocument[doc.id] ?? []}
                companies={companies}
                users={users}
              />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs text-[#6B695E]">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="underline disabled:opacity-30 disabled:no-underline"
              >
                Précédent
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="underline disabled:opacity-30 disabled:no-underline"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
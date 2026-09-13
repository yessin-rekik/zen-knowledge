"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

interface LogEntry {
  id: string;
  question: string | null;
  created_at: string;
  latency_ms?: number;
  content?: string;
}

export function QuestionsPanel({
  title,
  entries,
  showLatency,
}: {
  title: string;
  entries: LogEntry[];
  showLatency?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    let result = entries.filter((e) => {
      const matchesSearch =
        !search || (e.question ?? "").toLowerCase().includes(search.toLowerCase());
      const entryDate = new Date(e.created_at);
      const matchesFrom = !dateFrom || entryDate >= new Date(dateFrom);
      const matchesTo = !dateTo || entryDate <= new Date(dateTo + "T23:59:59");
      return matchesSearch && matchesFrom && matchesTo;
    });

    result.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

    return result;
  }, [entries, search, dateFrom, dateTo, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <section aria-label={title}>
      <div className="flex items-baseline gap-2 mb-3">
        <h2>{title}</h2>
        <span className="text-xs text-[#6B695E]">{filtered.length}</span>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B695E]" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher une question..."
            className="w-full pl-7 pr-2 py-1.5 rounded-md border border-[#D6D2CB] text-xs bg-white"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="px-2 py-1.5 rounded-md border border-[#D6D2CB] text-xs bg-white"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="px-2 py-1.5 rounded-md border border-[#D6D2CB] text-xs bg-white"
        />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
          className="px-2 py-1.5 rounded-md border border-[#D6D2CB] text-xs bg-white"
        >
          <option value="desc">Plus récent</option>
          <option value="asc">Plus ancien</option>
        </select>
        {(search || dateFrom || dateTo) && (
          <button onClick={resetFilters} className="text-xs text-[#6B695E] underline px-1">
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#6B695E] py-4 text-center border border-dashed border-[#D6D2CB] rounded-lg">
          Aucun élément
        </p>
      ) : (
        <>
          <ul className="divide-y divide-[#D6D2CB] rounded-lg border border-[#D6D2CB] bg-white overflow-hidden">
            {paginated.map((entry) => (
              <li key={entry.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm text-[#1C2321] truncate">
                    {entry.question || "(question non enregistrée)"}
                  </p>
                  {entry.content && (
                    <p className="text-xs text-[#6B695E] line-clamp-1">{entry.content}</p>
                  )}
                  <time dateTime={entry.created_at} className="text-xs text-[#6B695E]">
                    {new Date(entry.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                {showLatency && entry.latency_ms !== undefined && (
                  <span className="text-xs text-[#1C2321] tabular-nums shrink-0">
                    {entry.latency_ms}
                    <span className="text-[#6B695E]"> ms</span>
                  </span>
                )}
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2 text-xs text-[#6B695E]">
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
    </section>
  );
}
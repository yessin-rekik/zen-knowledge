"use client";

import { ExtractButton } from "./extract-button";
import { VersionHistory } from "./version-history";
import { ReuploadForm } from "./reupload-form";
import { DeleteButton } from "./delete-button";
import { AccessRulesPanel } from "./access-rules-panel";
import { publishDocument, deleteDocument, reuploadDocument } from "./actions";

interface DocumentRowProps {
  doc: {
    id: string;
    title: string;
    service: string | null;
    status: string;
    version: number;
    visibility_roles: string[];
    date_revision: string | null;
    extraction_status: string | null;
    is_group_wide: boolean;
  };
  canManage: boolean;
  rules: any[];
  companies: { id: string; name: string }[];
  users: { id: string; email: string }[];
}

function StatusBar({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    published: "status-bar-published",
    draft: "status-bar-draft",
    archived: "status-bar-archived",
  };
  return (
    <div
      className={`w-1 self-stretch rounded-sm shrink-0 ${colorMap[status] ?? "status-bar-archived"}`}
      aria-hidden="true"
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    published: { label: "Publié", className: "text-[#2D5D53] bg-[#EEF2F0]" },
    draft: { label: "Brouillon", className: "text-[#C08A3E] bg-[#FBF4E9]" },
    archived: { label: "Archivé", className: "text-[#6B695E] bg-[#EAE7E1]" },
  };
  const { label, className } = map[status] ?? map.archived;
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${className}`}>
      {label}
    </span>
  );
}

export function DocumentRow({ doc, canManage, rules, companies, users }: DocumentRowProps) {
  return (
    <li role="listitem" className="flex gap-3 py-4 items-start">
      <StatusBar status={doc.status} />

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="truncate">{doc.title}</h3>
          <StatusBadge status={doc.status} />
          {doc.is_group_wide && (
            <span className="text-[11px] text-[#2D5D53] bg-[#EEF2F0] px-1.5 py-0.5 rounded">
              Groupe entier
            </span>
          )}
          {doc.extraction_status && doc.extraction_status !== "ok" && (
            <span className="text-[11px] text-[#C08A3E] bg-[#FBF4E9] px-1.5 py-0.5 rounded">
              Extraction {doc.extraction_status}
            </span>
          )}
        </div>

        <p className="text-xs text-[#6B695E]">
          {[
            doc.service,
            `v${doc.version}`,
            doc.date_revision
              ? `révision ${new Date(doc.date_revision).toLocaleDateString("fr-FR")}`
              : null,
            doc.visibility_roles?.length > 0 ? doc.visibility_roles.join(", ") : null,
          ]
            .filter(Boolean)
            .join(" — ")}
        </p>

        <VersionHistory documentId={doc.id} />

        {canManage && (
          <AccessRulesPanel
            documentId={doc.id}
            isGroupWide={doc.is_group_wide}
            rules={rules}
            companies={companies}
            users={users}
          />
        )}
      </div>

      {canManage && (
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <ExtractButton documentId={doc.id} />

          {doc.status === "draft" && doc.extraction_status === "ok" && (
            <form action={publishDocument.bind(null, doc.id)}>
              <button
                type="submit"
                className="
                  px-2.5 py-1 rounded text-xs font-medium
                  border border-[#2D5D53]
                  text-[#2D5D53] bg-transparent
                  hover:bg-[#EEF2F0]
                  zen-transition
                  focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1
                "
              >
                Publier
              </button>
            </form>
          )}

          <ReuploadForm documentId={doc.id} documentTitle={doc.title} reuploadAction={reuploadDocument} />
          <DeleteButton documentId={doc.id} documentTitle={doc.title} deleteAction={deleteDocument} />
        </div>
      )}
    </li>
  );
}
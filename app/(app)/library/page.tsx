import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import {
  createDocument,
  publishDocument,
  deleteDocument,
  reuploadDocument,
} from "./actions";
import { ExtractButton } from "./extract-button";
import { VersionHistory } from "./version-history";
import { ReuploadForm } from "./reupload-form";
import { ChevronDown, Plus, Trash2, Clock } from "lucide-react";
import { DeleteButton } from "./delete-button";
import { CustomFileInput, CustomDateInput } from "./custom-inputs";
import { AddDocumentToggle } from "./add-document-toggle";

export const metadata = {
  title: "Bibliothèque",
};

/* ── Barre de statut ── */
function StatusBar({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    published: "status-bar-published",
    draft: "status-bar-draft",
    archived: "status-bar-archived",
  };
  return (
    <div
      className={`w-1 self-stretch rounded-sm shrink-0 ${
        colorMap[status] ?? "status-bar-archived"
      }`}
      aria-hidden="true"
    />
  );
}

/* ── Badge statut textuel ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    published: {
      label: "Publié",
      className: "text-[#2D5D53] bg-[#EEF2F0]",
    },
    draft: {
      label: "Brouillon",
      className: "text-[#C08A3E] bg-[#FBF4E9]",
    },
    archived: {
      label: "Archivé",
      className: "text-[#6B695E] bg-[#EAE7E1]",
    },
  };
  const { label, className } = map[status] ?? map.archived;
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export default async function LibraryPage() {
  const session = await auth();
  const companyId = (session?.user as any)?.companyId;
  const role = (session?.user as any)?.role;
  const canManage = role === "admin" || role === "manager";

  let query = supabaseAdmin
    .from("documents")
    .select(
      "id, title, service, status, version, visibility_roles, date_revision, extraction_status",
    )
    .eq("company_id", companyId);

  if (!canManage) {
    query = query
      .eq("status", "published")
      .contains("visibility_roles", [role]);
  }

  const { data: documents } = await query.order("created_at", {
    ascending: false,
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* En-tête de page */}
        <div className="flex items-center justify-between">
          <h1>Bibliothèque</h1>
          {canManage && <AddDocumentToggle />}
        </div>

        {/* ── Formulaire création — accordion natif ── */}
        {canManage && (
          <details
            id="add-doc-panel"
            className="border border-[#D6D2CB] rounded-lg overflow-hidden"
          >
            <summary
              id="add-doc-toggle"
              className="
                flex items-center justify-between
                px-5 py-3.5 cursor-pointer
                text-sm font-medium text-[#1C2321]
                bg-[#F7F5F0] hover:bg-[#EAE7E1]
                list-none
                zen-transition
                focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-[-2px]
              "
            >
              <span>Nouveau document</span>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className="text-[#6B695E] transition-transform duration-200 details-chevron"
                aria-hidden="true"
              />
            </summary>

            <div className="px-5 py-5 bg-white border-t border-[#D6D2CB]">
              <form action={createDocument} className="space-y-4">
                {/* Titre */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="doc-title"
                    className="block text-sm font-medium text-[#1C2321]"
                  >
                    Titre du document
                  </label>
                  <input
                    id="doc-title"
                    name="title"
                    placeholder="ex. Politique de congés 2025"
                    required
                    className="
                      w-full px-3 py-2 rounded-md
                      border border-[#D6D2CB]
                      text-sm text-[#1C2321] placeholder:text-[#6B695E]/60
                      bg-white
                      focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-0
                    "
                  />
                </div>

                {/* Service */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="doc-service"
                    className="block text-sm font-medium text-[#1C2321]"
                  >
                    Service
                  </label>
                  <input
                    id="doc-service"
                    name="service"
                    placeholder="ex. RH, Finance, IT"
                    className="
                      w-full px-3 py-2 rounded-md
                      border border-[#D6D2CB]
                      text-sm text-[#1C2321] placeholder:text-[#6B695E]/60
                      bg-white
                      focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-0
                    "
                  />
                </div>

                {/* Rôles */}
                <fieldset>
                  <legend className="text-sm font-medium text-[#1C2321] mb-2">
                    Rôles autorisés
                  </legend>
                  <div className="flex gap-4">
                    {["admin", "manager", "employee"].map((r) => (
                      <label
                        key={r}
                        className="flex items-center gap-2 text-sm text-[#1C2321] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          name="visibility_roles"
                          value={r}
                          className="
                            w-3.5 h-3.5 rounded-sm
                            border-[#D6D2CB]
                            accent-[#2D5D53]
                            focus-visible:outline-2 focus-visible:outline-[#2D5D53]
                          "
                        />
                        <span className="capitalize">{r}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Fichier PDF */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="file-input-file"
                    className="block text-sm font-medium text-[#1C2321]"
                  >
                    Fichier PDF
                  </label>
                  <CustomFileInput name="file" accept=".pdf" required={true} />
                </div>

                {/* Date de révision */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="doc-revision"
                    className="block text-sm font-medium text-[#1C2321]"
                  >
                    Date de révision prévue
                  </label>
                  <CustomDateInput name="date_revision" />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="
                      px-4 py-2 rounded-md
                      text-sm font-medium
                      bg-[#2D5D53] text-[#F7F5F0]
                      hover:bg-[#245048]
                      zen-transition
                      focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-2
                    "
                  >
                    Créer le document
                  </button>
                </div>
              </form>
            </div>
          </details>
        )}

        {/* ── Liste des documents ── */}
        <section aria-label="Documents">
          <div className="flex items-baseline justify-between mb-3">
            <h2>Documents</h2>
            {documents && (
              <span className="text-xs text-[#6B695E]">
                {documents.length} document{documents.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {documents?.length === 0 && (
            <p className="text-sm text-[#6B695E] py-8 text-center">
              Aucun document pour le moment.
            </p>
          )}

          <ul className="divide-y divide-[#D6D2CB]" role="list">
            {documents?.map((doc) => (
              <li
                key={doc.id}
                role="listitem"
                className="flex gap-3 py-4 items-start"
              >
                {/* Barre de statut */}
                <StatusBar status={doc.status} />

                {/* Contenu principal */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Titre + badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="truncate">{doc.title}</h3>
                    <StatusBadge status={doc.status} />
                    {doc.extraction_status &&
                      doc.extraction_status !== "ok" && (
                        <span className="text-[11px] text-[#C08A3E] bg-[#FBF4E9] px-1.5 py-0.5 rounded">
                          Extraction {doc.extraction_status}
                        </span>
                      )}
                  </div>

                  {/* Métadonnées */}
                  <p className="text-xs text-[#6B695E]">
                    {[
                      doc.service,
                      `v${doc.version}`,
                      doc.date_revision
                        ? `révision ${new Date(doc.date_revision).toLocaleDateString("fr-FR")}`
                        : null,
                      doc.visibility_roles?.length > 0
                        ? doc.visibility_roles.join(", ")
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" — ")}
                  </p>

                  {/* Historique versions */}
                  <VersionHistory documentId={doc.id} />
                </div>

                {/* Actions — réservées à admin/manager */}
                {canManage && (
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <ExtractButton documentId={doc.id} />

                    {doc.status === "draft" &&
                      doc.extraction_status === "ok" && (
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

                    <ReuploadForm
                      documentId={doc.id}
                      documentTitle={doc.title}
                      reuploadAction={reuploadDocument}
                    />

                    <DeleteButton
                      documentId={doc.id}
                      documentTitle={doc.title}
                      deleteAction={deleteDocument}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

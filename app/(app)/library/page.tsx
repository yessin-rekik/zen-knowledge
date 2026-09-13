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
import { AccessRulesPanel } from "./access-rules-panel";
import { DocumentsPanel } from "./documents-panel";

import { getEffectiveCompanyId } from "@/lib/context";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Bibliothèque",
};

export default async function LibraryPage() {
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role;
  const companyId = await getEffectiveCompanyId(user);
  const canManage = role === "admin" || role === "manager";

  if (role === "group_admin" && !companyId) {
    redirect("/group");
  }

  let query = supabaseAdmin
    .from("documents")
    .select(
      "id, title, service, status, version, visibility_roles, date_revision, extraction_status, is_group_wide",
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

  // Données pour les règles d'accès — chargées uniquement si l'utilisateur peut gérer
  let allCompanies: { id: string; name: string }[] = [];
  let allUsers: { id: string; email: string }[] = [];
  let rulesByDocument: Record<string, any[]> = {};

  if (canManage && documents && documents.length > 0) {
    const { data: companiesData } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .order("name");
    allCompanies = companiesData ?? [];

    const { data: usersData } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .order("email");
    allUsers = usersData ?? [];

    const docIds = documents.map((d) => d.id);
    const { data: rulesData } = await supabaseAdmin
      .from("document_access_rules")
      .select("id, document_id, scope_type, scope_id, access")
      .in("document_id", docIds);

    rulesByDocument = (rulesData ?? []).reduce(
      (acc: Record<string, any[]>, rule) => {
        if (!acc[rule.document_id]) acc[rule.document_id] = [];
        acc[rule.document_id].push(rule);
        return acc;
      },
      {},
    );
  }

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

          {documents?.length === 0 ? (
            <p className="text-sm text-[#6B695E] py-8 text-center">
              Aucun document pour le moment.
            </p>
          ) : (
            <DocumentsPanel
              documents={documents ?? []}
              canManage={canManage}
              rulesByDocument={rulesByDocument}
              companies={allCompanies}
              users={allUsers}
            />
          )}
        </section>
      </div>
    </div>
  );
}

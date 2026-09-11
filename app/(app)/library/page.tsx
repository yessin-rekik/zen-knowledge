import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { createDocument } from "./actions";
import { ExtractButton } from "./extract-button";
import { publishDocument } from "./actions";
import { deleteDocument } from "./actions";
import { reuploadDocument } from "./actions";
import { VersionHistory } from "./version-history";

export default async function LibraryPage() {
  const session = await auth();
  const companyId = (session?.user as any)?.companyId;

  const { data: documents } = await supabaseAdmin
    .from("documents")
    .select(
      "id, title, service, status, version, visibility_roles, date_revision, extraction_status",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-8">
      <h1 className="text-xl font-semibold">Bibliothèque de documents</h1>

      <form action={createDocument} className="space-y-3 border rounded p-4">
        <input
          name="title"
          placeholder="Titre du document"
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          name="service"
          placeholder="Service (ex: RH, Finance)"
          className="w-full rounded border px-3 py-2"
        />
        <div className="space-y-1">
          <p className="text-sm text-gray-600">Rôles autorisés :</p>
          {["admin", "manager", "employee"].map((role) => (
            <label key={role} className="mr-4 inline-flex items-center gap-1">
              <input type="checkbox" name="visibility_roles" value={role} />
              {role}
            </label>
          ))}
        </div>
        <input
          type="file"
          name="file"
          accept=".pdf"
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          type="date"
          name="date_revision"
          className="w-full rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Créer
        </button>
      </form>

      <ul className="space-y-2">
        {documents?.map((doc) => (
          <li
            key={doc.id}
            className="border rounded p-3 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{doc.title}</p>
              <p className="text-sm text-gray-500">
                {doc.service} — v{doc.version} — {doc.status} — rôles:{" "}
                {doc.visibility_roles.join(", ")}
                {doc.extraction_status &&
                  ` — extraction: ${doc.extraction_status}`}
              </p>
              <VersionHistory documentId={doc.id} />
            </div>
            <div className="flex gap-2 items-center">
              <ExtractButton documentId={doc.id} />
              {doc.status === "draft" && doc.extraction_status === "ok" && (
                <form action={publishDocument.bind(null, doc.id)}>
                  <button
                    type="submit"
                    className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                  >
                    Publier
                  </button>
                </form>
              )}
            </div>
            <form
              action={async (formData: FormData) => {
                "use server";
                await reuploadDocument(doc.id, formData);
              }}
              className="flex items-center gap-1"
            >
              <input
                type="file"
                name="file"
                accept=".pdf"
                className="text-xs"
                required
              />
              <button
                type="submit"
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
              >
                Nouvelle version
              </button>
            </form>
            <form action={deleteDocument.bind(null, doc.id)}>
              <button
                type="submit"
                className="rounded bg-red-600 px-3 py-1 text-sm text-white"
              >
                Supprimer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

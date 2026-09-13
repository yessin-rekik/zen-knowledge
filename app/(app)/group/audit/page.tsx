import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Journal d'audit",
};

const actionLabels: Record<string, string> = {
  "company.create": "Création de société",
  "department.create": "Création de département",
  "context.switch_company": "Bascule vers une société",
  "context.leave_company": "Sortie de contexte",
};

export default async function AuditPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "group_admin") {
    redirect("/chat");
  }

  const { data: logs } = await supabaseAdmin
    .from("audit_log")
    .select(
      "id, actor_id, action, target_type, target_id, metadata, created_at, users(email)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const companyIds = (logs ?? [])
    .filter((l) => l.target_type === "company" && l.target_id)
    .map((l) => l.target_id);

  const { data: companiesData } =
    companyIds.length > 0
      ? await supabaseAdmin
          .from("companies")
          .select("id, name")
          .in("id", companyIds)
      : { data: [] };

  const companyNameMap = new Map(
    (companiesData ?? []).map((c) => [c.id, c.name]),
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h1>Journal d'audit</h1>
        <p className="text-sm text-[#6B695E]">
          Historique des actions transverses (100 dernières entrées).
        </p>

        <ul className="divide-y divide-[#D6D2CB] rounded-lg border border-[#D6D2CB] bg-white overflow-hidden">
          {(logs ?? []).map((log: any) => (
            <li
              key={log.id}
              className="px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm text-[#1C2321]">
                  <span className="font-medium">
                    {log.users?.email ?? "Utilisateur inconnu"}
                  </span>
                  {" — "}
                  {actionLabels[log.action] ?? log.action}
                  {log.target_type === "company" &&
                    companyNameMap.get(log.target_id) && (
                      <>
                        {" "}
                        :{" "}
                        <span className="font-medium">
                          {companyNameMap.get(log.target_id)}
                        </span>
                      </>
                    )}
                </p>
                {log.metadata && (
                  <p className="text-xs text-[#6B695E] truncate">
                    {JSON.stringify(log.metadata)}
                  </p>
                )}
              </div>
              <time
                dateTime={log.created_at}
                className="text-xs text-[#6B695E] shrink-0"
              >
                {new Date(log.created_at).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ul>

        {(!logs || logs.length === 0) && (
          <p className="text-sm text-[#6B695E] py-8 text-center">
            Aucune activité enregistrée.
          </p>
        )}
      </div>
    </div>
  );
}

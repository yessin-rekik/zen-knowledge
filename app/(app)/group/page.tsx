import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { redirect } from "next/navigation";
import { getActiveCompanyId } from "@/lib/active-company";
import { CreateCompanyForm } from "./create-company-form";
import { CreateDepartmentForm } from "./create-department-form";
import { CompanySwitchButton } from "./company-switch-button";

export const metadata = {
  title: "Groupe",
};

export default async function GroupPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "group_admin") {
    redirect("/chat");
  }

  const activeCompanyId = await getActiveCompanyId();

  const { data: companies } = await supabaseAdmin
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("id, name, company_id")
    .order("name", { ascending: true });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <h1>Groupe — Sociétés</h1>

        <section className="rounded-lg border border-[#D6D2CB] bg-white p-6">
          <h2 className="mb-4">Nouvelle société</h2>
          <CreateCompanyForm />
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2>Sociétés</h2>
            {companies && (
              <span className="text-xs text-[#6B695E]">
                {companies.length} société{companies.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <ul className="divide-y divide-[#D6D2CB] rounded-lg border border-[#D6D2CB] bg-white overflow-hidden">
            {companies?.map((c) => (
              <li key={c.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#1C2321]">
                    {c.name}
                    {activeCompanyId === c.id && (
                      <span className="ml-2 text-[11px] text-[#2D5D53] bg-[#EEF2F0] px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#6B695E]">
                    {departments?.filter((d) => d.company_id === c.id).map((d) => d.name).join(", ") || "Aucun département"}
                  </p>
                </div>
                <CompanySwitchButton companyId={c.id} isActive={activeCompanyId === c.id} />
              </li>
            ))}
          </ul>
        </section>


          <CreateDepartmentForm companies={companies ?? []} />
        
      </div>
    </div>
  );
}
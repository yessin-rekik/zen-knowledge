"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { clearActiveCompanyId, setActiveCompanyId } from "@/lib/active-company";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireGroupAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");
  const role = (session.user as any).role;
  if (role !== "group_admin") throw new Error("Accès réservé à l'administrateur de groupe.");
  return session.user as any;
}

export async function createCompany(formData: FormData) {
  const user = await requireGroupAdmin();
  const name = formData.get("name") as string;
  if (!name) throw new Error("Nom requis.");

  const { data, error } = await supabaseAdmin
    .from("companies")
    .insert({ name })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({
    actorId: user.id,
    action: "company.create",
    targetType: "company",
    targetId: data.id,
    metadata: { name },
  });

  revalidatePath("/group");
}

export async function createDepartment(formData: FormData) {
  const user = await requireGroupAdmin();
  const companyId = formData.get("companyId") as string;
  const name = formData.get("name") as string;
  if (!companyId || !name) throw new Error("Société et nom requis.");

  const { data, error } = await supabaseAdmin
    .from("departments")
    .insert({ company_id: companyId, name })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({
    actorId: user.id,
    action: "department.create",
    targetType: "department",
    targetId: data.id,
    metadata: { name, companyId },
  });

  revalidatePath("/group");
}

export async function switchActiveCompany(companyId: string) {
  const user = await requireGroupAdmin();

  await setActiveCompanyId(companyId);

  await logAudit({
    actorId: user.id,
    action: "context.switch_company",
    targetType: "company",
    targetId: companyId,
  });

  redirect("/chat");
}

export async function leaveCompanyContext() {
  const user = await requireGroupAdmin();

  await clearActiveCompanyId();

  await logAudit({
    actorId: user.id,
    action: "context.leave_company",
  });

  redirect("/group");
}
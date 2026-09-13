import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { InviteForm } from "./invite-form";
import { EditUserRow } from "./edit-user-row";
import { redirect } from "next/navigation";
import { getEffectiveCompanyId } from "@/lib/context";

export const metadata = {
  title: "Collaborateurs",
};

export default async function UsersPage() {
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role;
  const currentUserId = user?.id;

  if (role !== "admin" && role !== "group_admin") {
    redirect("/chat");
  }

  const companyId = await getEffectiveCompanyId(user);
  if (!companyId) {
    redirect("/group");
  }

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, email, role")
    .eq("company_id", companyId)
    .order("email", { ascending: true });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <h1>Collaborateurs</h1>

        
          <InviteForm />
        

        <section aria-label="Liste des collaborateurs">
          <div className="flex items-baseline justify-between mb-3">
            <h2>Membres de votre société</h2>
            {users && (
              <span className="text-xs text-[#6B695E] px-5">
                {users.length} membre{users.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <ul className="divide-y divide-[#D6D2CB] rounded-lg border border-[#D6D2CB] bg-white overflow-hidden">
            {users?.map((u) => (
              <EditUserRow
                key={u.id}
                userId={u.id}
                email={u.email}
                role={u.role}
                isSelf={u.id === currentUserId}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
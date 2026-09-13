import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { InviteForm } from "./invite-form";
import { EditUserRow } from "./edit-user-row";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Collaborateurs",
};

export default async function UsersPage() {
  const session = await auth();
  const companyId = (session?.user as any)?.companyId;
  const currentUserId = (session?.user as any)?.id;

  const role = (session?.user as any)?.role;

if (role !== "admin" && role !== "group_admin") {
  redirect("/chat");
}

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, email, role")
    .eq("company_id", companyId)
    .order("email", { ascending: true });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <h1>Collaborateurs</h1>

        <InviteForm />

        <section aria-label="Liste des collaborateurs">
          <h2 className="mb-3">Membres de votre société</h2>
          <ul className="divide-y divide-[#D6D2CB]">
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
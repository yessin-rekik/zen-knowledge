import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";
import { UserCircle } from "lucide-react";

export const metadata = {
  title: "Profil",
};

const roleLabels: Record<string, { label: string; className: string }> = {
  admin: { label: "Admin", className: "text-[#2D5D53] bg-[#EEF2F0]" },
  manager: { label: "Manager", className: "text-[#2D5D53] bg-[#EEF2F0]" },
  employee: { label: "Employee", className: "text-[#6B695E] bg-[#EAE7E1]" },
  group_admin: { label: "Group Admin", className: "text-[#C08A3E] bg-[#FBF4E9]" },
};

export default async function ProfilePage() {
  const session = await auth();
  const email = (session?.user as any)?.email;
  const role = (session?.user as any)?.role;
  const roleInfo = roleLabels[role] ?? { label: role, className: "text-[#6B695E] bg-[#EAE7E1]" };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <h1>Mon profil</h1>

        <section className="rounded-lg border border-[#D6D2CB] bg-white p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#EEF2F0] flex items-center justify-center shrink-0">
            <UserCircle size={26} strokeWidth={1.5} className="text-[#2D5D53]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1C2321]">{email}</p>
            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${roleInfo.className}`}>
              {roleInfo.label}
            </span>
          </div>
        </section>


          <ChangePasswordForm />

      </div>
    </div>
  );
}
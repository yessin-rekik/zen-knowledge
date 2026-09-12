import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = {
  title: "Profil",
};

export default async function ProfilePage() {
  const session = await auth();
  const email = (session?.user as any)?.email;
  const role = (session?.user as any)?.role;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-md mx-auto px-6 py-8 space-y-8">
        <h1>Mon profil</h1>

        <section className="space-y-1">
          <p className="text-sm text-[#6B695E]">Email</p>
          <p className="text-sm font-medium text-[#1C2321]">{email}</p>
          <p className="text-sm text-[#6B695E] capitalize mt-2">Rôle : {role}</p>
        </section>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
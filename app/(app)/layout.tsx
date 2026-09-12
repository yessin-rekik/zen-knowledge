import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { ZenLogo } from "@/components/ui/zen-logo";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { LogOut } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as
    | { email?: string | null; role?: string }
    | undefined;

  return (
    <div className="flex flex-1 overflow-hidden bg-[#F7F5F0]">
      {/* ── Sidebar principale ── */}
      <aside
        className="
          flex flex-col
          w-12 sm:w-[220px]
          shrink-0
          bg-[#EAE7E1]
          border-r border-[#D6D2CB]
          overflow-y-auto
        "
        aria-label="Navigation de l'application"
      >
        {/* Logotype */}
        <div className="flex items-center justify-center sm:justify-start gap-2.5 py-4 sm:px-4 border-b border-[#D6D2CB]">
          <ZenLogo size={24} />
          <span className="hidden sm:block text-sm font-600 tracking-tight text-[#1C2321]">
            ZEN Knowledge
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 py-3">
          <SidebarNav />
        </div>

        {/* Pied de sidebar — utilisateur + déconnexion */}
        <div className="border-t border-[#D6D2CB] px-2 py-3 space-y-1">
          {user?.email && (
            <div className="hidden sm:block px-3 py-1.5">
              <p
                className="text-xs text-[#6B695E] truncate"
                title={user.email}
              >
                {user.email}
              </p>
              {user.role && (
                <p className="text-[11px] text-[#6B695E]/70 capitalize mt-0.5">
                  {user.role}
                </p>
              )}
            </div>
          )}

          {/* Déconnexion via Server Action POST — pas un lien GET */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="
                flex items-center justify-center sm:justify-start gap-2.5 w-full
                px-0 sm:px-3 py-2 rounded-md
                text-sm text-[#6B695E]
                hover:text-[#B54A45] hover:bg-[#FAEAEA]
                zen-transition
                focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1
              "
              aria-label="Se déconnecter"
            >
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Zone de contenu principale ── */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

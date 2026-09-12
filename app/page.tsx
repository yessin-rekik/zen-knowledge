import Link from "next/link";
import { ZenLogo } from "@/components/ui/zen-logo";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F5F0]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <ZenLogo size={28} />
          <span className="text-lg font-600 tracking-tight text-[#1C2321]">
            ZEN Knowledge
          </span>
        </div>
        <Link
          href="/login"
          className="
            px-4 py-2 rounded-md
            text-sm font-medium
            border border-[#D6D2CB] text-[#1C2321]
            hover:border-[#2D5D53] hover:text-[#2D5D53]
            zen-transition
            focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1
          "
        >
          Connexion
        </Link>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-4xl sm:text-5xl font-700 text-[#1C2321] tracking-tight leading-[1.15]">
            L'intelligence collective, <br className="hidden sm:block" />
            <span className="text-[#2D5D53]">à portée de main.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-[#6B695E] leading-relaxed max-w-xl mx-auto">
            Retrouvez instantanément les informations clés de votre organisation.
            Politiques, procédures et notes internes accessibles via une interface conversationnelle simple et sécurisée.
          </p>

          <div className="pt-4 flex items-center justify-center">
            <Link
              href="/login"
              className="
                flex items-center gap-2
                px-6 py-3 rounded-md
                text-base font-medium
                bg-[#2D5D53] text-[#F7F5F0]
                hover:bg-[#245048]
                zen-transition shadow-sm
                focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-2
              "
            >
              Accéder à l'espace collaborateur
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* ── Feature Highlights (Optional Visual Balance) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-4xl mx-auto text-left">
          <div className="space-y-2">
            <h3 className="text-sm font-600 text-[#1C2321]">Recherche sémantique</h3>
            <p className="text-sm text-[#6B695E] leading-relaxed">
              Posez vos questions naturellement. Notre moteur comprend le contexte et vous fournit des réponses précises.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-600 text-[#1C2321]">Sources vérifiables</h3>
            <p className="text-sm text-[#6B695E] leading-relaxed">
              Chaque réponse est accompagnée de citations directes vers les documents internes officiels.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-600 text-[#1C2321]">Contrôle d'accès strict</h3>
            <p className="text-sm text-[#6B695E] leading-relaxed">
              La visibilité des documents respecte la hiérarchie et les rôles définis par votre organisation.
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-8 text-center text-[11px] text-[#6B695E]/60 border-t border-[#D6D2CB]/50">
        © {new Date().getFullYear()} — ZEN Knowledge. Usage interne uniquement.
      </footer>
    </div>
  );
}

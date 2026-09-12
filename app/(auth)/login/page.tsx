"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ZenLogo } from "@/components/ui/zen-logo";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Identifiants invalides. Vérifiez votre adresse et mot de passe.");
      return;
    }

    router.push("/chat");
  };

  return (
    <div
      className="
        flex min-h-screen items-center justify-center
        bg-[#F7F5F0] px-4
      "
    >
      <div className="w-full max-w-[380px]">
        {/* Logotype */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center gap-2.5 mb-4">
            <ZenLogo size={32} />
            <span className="text-lg font-semibold tracking-tight text-[#1C2321]">
              ZEN Knowledge
            </span>
          </div>
          <p className="text-sm text-[#6B695E] max-w-[260px] leading-relaxed">
            Accès sécurisé aux connaissances de votre organisation
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white border border-[#D6D2CB] rounded-lg px-6 py-7 shadow-[0_1px_4px_rgba(28,35,33,0.06)]">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-[#1C2321]"
              >
                Adresse email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="
                  w-full px-3 py-2.5 rounded-md
                  border border-[#D6D2CB]
                  text-sm text-[#1C2321]
                  placeholder:text-[#6B695E]/50
                  bg-white
                  focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-0
                  transition-colors
                "
                placeholder="vous@entreprise.fr"
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-[#1C2321]"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="
                    w-full px-3 py-2.5 pr-10 rounded-md
                    border border-[#D6D2CB]
                    text-sm text-[#1C2321]
                    bg-white
                    focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-0
                    transition-colors
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-[#6B695E] hover:text-[#1C2321]
                    zen-transition
                    focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1 rounded
                  "
                >
                  {showPassword ? (
                    <EyeOff size={15} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Eye size={15} strokeWidth={1.75} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div
                role="alert"
                className="
                  flex items-start gap-2
                  px-3 py-2.5 rounded-md
                  bg-[#FAEAEA] text-[#B54A45]
                  text-xs leading-relaxed
                "
              >
                <AlertCircle
                  size={13}
                  strokeWidth={2}
                  className="shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                {error}
              </div>
            )}

            {/* Bouton connexion */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="
                w-full py-2.5 rounded-md
                text-sm font-medium
                bg-[#2D5D53] text-[#F7F5F0]
                hover:bg-[#245048]
                disabled:opacity-50 disabled:cursor-not-allowed
                zen-transition
                focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-2
              "
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Pied de page */}
        <p className="text-center text-[11px] text-[#6B695E]/60 mt-6 select-none">
          Usage interne uniquement — accès restreint
        </p>
      </div>
    </div>
  );
}
"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function inviteCollaborator(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const requesterRole = (session.user as any).role;
  if (requesterRole !== "admin") {
    throw new Error("Seul un admin peut inviter des collaborateurs.");
  }

  const companyId = (session.user as any).companyId;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;

  if (!email || !["admin", "manager", "employee"].includes(role)) {
    throw new Error("Email et rôle valides requis.");
  }

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) throw new Error("Un utilisateur avec cet email existe déjà.");

  // Mot de passe temporaire généré aléatoirement — affiché une seule fois à l'admin
  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const { error } = await supabaseAdmin.from("users").insert({
    email,
    company_id: companyId,
    role,
    password_hash: passwordHash,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");

  return { tempPassword };
}

export async function deactivateCollaborator(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const requesterRole = (session.user as any).role;
  if (requesterRole !== "admin") {
    throw new Error("Seul un admin peut désactiver un collaborateur.");
  }

  const companyId = (session.user as any).companyId;

  const { data: targetUser, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (fetchError || !targetUser) throw new Error("Utilisateur introuvable.");
  if (targetUser.company_id !== companyId) throw new Error("Accès refusé.");

  await supabaseAdmin.from("users").update({ company_id: null }).eq("id", userId);

  revalidatePath("/admin/users");
}

export async function updateCollaboratorEmail(userId: string, newEmail: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const requesterRole = (session.user as any).role;
  if (requesterRole !== "admin") throw new Error("Accès refusé.");

  const companyId = (session.user as any).companyId;

  const { data: targetUser, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (fetchError || !targetUser) throw new Error("Utilisateur introuvable.");
  if (targetUser.company_id !== companyId) throw new Error("Accès refusé.");

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", newEmail)
    .neq("id", userId)
    .maybeSingle();

  if (existing) throw new Error("Cet email est déjà utilisé.");

  const { error } = await supabaseAdmin
    .from("users")
    .update({ email: newEmail })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

export async function resetCollaboratorPassword(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const requesterRole = (session.user as any).role;
  if (requesterRole !== "admin") throw new Error("Accès refusé.");

  const companyId = (session.user as any).companyId;

  const { data: targetUser, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (fetchError || !targetUser) throw new Error("Utilisateur introuvable.");
  if (targetUser.company_id !== companyId) throw new Error("Accès refusé.");

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const { error } = await supabaseAdmin
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
  return { tempPassword };
}
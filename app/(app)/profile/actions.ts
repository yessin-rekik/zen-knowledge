"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const userId = (session.user as any).id;
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!currentPassword || !newPassword) {
    throw new Error("Mot de passe actuel et nouveau requis.");
  }
  if (newPassword.length < 8) {
    throw new Error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
  }

  const { data: user, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .single();

  if (fetchError || !user) throw new Error("Utilisateur introuvable.");

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new Error("Mot de passe actuel incorrect.");

  const newHash = await bcrypt.hash(newPassword, 10);

  const { error } = await supabaseAdmin
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}
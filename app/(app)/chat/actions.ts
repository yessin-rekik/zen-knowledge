"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";

export async function setFeedback(messageId: string, feedback: "helpful" | "inaccurate") {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");

  const { error } = await supabaseAdmin
    .from("messages")
    .update({ feedback })
    .eq("id", messageId);

  if (error) throw new Error(error.message);
}
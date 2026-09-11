import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const companyId = (session.user as any).companyId;

  const { data: document, error } = await supabaseAdmin
    .from("documents")
    .select("company_id, file_path")
    .eq("id", id)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }
  if (document.company_id !== companyId) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  if (!document.file_path) {
    return NextResponse.json({ error: "Aucun fichier associé." }, { status: 404 });
  }

  const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUrl(document.file_path, 60);

  if (urlError) {
    return NextResponse.json({ error: urlError.message }, { status: 500 });
  }

  return NextResponse.json({ url: signedUrl.signedUrl });
}
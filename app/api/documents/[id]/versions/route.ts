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

  const { data: document, error: docError } = await supabaseAdmin
    .from("documents")
    .select("company_id")
    .eq("id", id)
    .single();

  if (docError || !document || document.company_id !== companyId) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { data: versions, error } = await supabaseAdmin
    .from("document_versions")
    .select("id, version, extraction_status, created_at")
    .eq("document_id", id)
    .order("version", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions });
}
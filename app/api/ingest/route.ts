import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { extractTextFromDocument } from "@/lib/extraction";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { documentId } = await req.json();
  if (!documentId) {
    return NextResponse.json({ error: "documentId requis." }, { status: 400 });
  }

  const companyId = (session.user as any).companyId;

  const { data: document, error: fetchError } = await supabaseAdmin
    .from("documents")
    .select("id, company_id, file_path")
    .eq("id", documentId)
    .single();

  if (fetchError || !document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }
  if (document.company_id !== companyId) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  if (!document.file_path) {
    return NextResponse.json({ error: "Aucun fichier associé." }, { status: 400 });
  }

   try {
    const { text, status } = await extractTextFromDocument(document.file_path);

    await supabaseAdmin
      .from("documents")
      .update({ extraction_status: status })
      .eq("id", documentId);

    if (status === "extraction_failed") {
      return NextResponse.json({ status, textLength: 0 });
    }

    const { chunkText } = await import("@/lib/chunking");
    const chunks = chunkText(text);

    const { data: docRow } = await supabaseAdmin
      .from("documents")
      .select("version")
      .eq("id", documentId)
      .single();

    const chunkRows = chunks.map((content) => ({
      document_id: documentId,
      version: docRow?.version ?? 1,
      content,
      is_active: true,
    }));

    const { error: chunkError } = await supabaseAdmin
      .from("document_chunks")
      .insert(chunkRows);

    if (chunkError) throw new Error(chunkError.message);

    return NextResponse.json({ status, textLength: text.length, chunkCount: chunks.length });
  } catch (err: any) {
    await supabaseAdmin
      .from("documents")
      .update({ extraction_status: "extraction_failed" })
      .eq("id", documentId);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
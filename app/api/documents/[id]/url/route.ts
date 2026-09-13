import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const companyId = (session.user as any).companyId;
  const versionId = req.nextUrl.searchParams.get("versionId");

  const { data: document, error } = await supabaseAdmin
    .from("documents")
    .select("company_id, file_path")
    .eq("id", id)
    .single();

  if (error || !document) {
    return NextResponse.json(
      { error: "Document introuvable." },
      { status: 404 },
    );
  }
  const userId = (session.user as any).id;

  const isOwnCompany = document.company_id === companyId;

  const { data: isGroupWideDoc } = await supabaseAdmin
    .from("documents")
    .select("is_group_wide")
    .eq("id", id)
    .single();

  const { data: allowRule } = await supabaseAdmin
    .from("document_access_rules")
    .select("id")
    .eq("document_id", id)
    .eq("access", "allow")
    .or(`scope_id.eq.${companyId},scope_id.eq.${userId}`)
    .maybeSingle();

  const { data: denyRule } = await supabaseAdmin
    .from("document_access_rules")
    .select("id")
    .eq("document_id", id)
    .eq("access", "deny")
    .or(`scope_id.eq.${companyId},scope_id.eq.${userId}`)
    .maybeSingle();

  const hasAccess =
    !denyRule && (isOwnCompany || isGroupWideDoc?.is_group_wide || !!allowRule);

  if (!hasAccess) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let filePath = document.file_path;

  if (versionId) {
    const { data: version, error: versionError } = await supabaseAdmin
      .from("document_versions")
      .select("file_path, document_id")
      .eq("id", versionId)
      .single();

    if (versionError || !version || version.document_id !== id) {
      return NextResponse.json(
        { error: "Version introuvable." },
        { status: 404 },
      );
    }
    filePath = version.file_path;
  }

  if (!filePath) {
    return NextResponse.json(
      { error: "Aucun fichier associé." },
      { status: 404 },
    );
  }

  const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUrl(filePath, 60);

  if (urlError) {
    return NextResponse.json({ error: urlError.message }, { status: 500 });
  }

  return NextResponse.json({ url: signedUrl.signedUrl });
}

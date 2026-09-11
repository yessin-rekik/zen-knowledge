import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { retrieveRelevantChunks, generateAnswer } from "@/lib/rag";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const companyId = (session.user as any).companyId;
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const { question, conversationId } = await req.json();
  if (!question) {
    return NextResponse.json({ error: "Question requise." }, { status: 400 });
  }

  const startTime = Date.now();

  let convId = conversationId;
  if (!convId) {
    const { data: conv, error: convError } = await supabaseAdmin
      .from("conversations")
      .insert({ user_id: userId })
      .select("id")
      .single();
    if (convError) throw new Error(convError.message);
    convId = conv.id;
  }

  await supabaseAdmin.from("messages").insert({
    conversation_id: convId,
    role: "user",
    content: question,
  });

  const chunks = await retrieveRelevantChunks(question, companyId, role);
  const result = await generateAnswer(question, chunks);

  const latencyMs = Date.now() - startTime;

  const { data: assistantMessage, error: msgError } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: convId,
      role: "assistant",
      content: result.answer,
      retrieved_chunk_ids: result.usedChunks.map((c) => c.chunkId),
    })
    .select("id")
    .single();

  if (msgError) throw new Error(msgError.message);

  await supabaseAdmin.from("query_logs").insert({
    user_id: userId,
    latency_ms: latencyMs,
    model: "llama-3.3-70b-versatile",
    tokens_in: result.tokensIn,
    tokens_out: result.tokensOut,
    retrieved_doc_ids: [...new Set(result.usedChunks.map((c) => c.documentId))],
  });

  return NextResponse.json({
    conversationId: convId,
    messageId: assistantMessage.id,
    answer: result.answer,
    sources: result.usedChunks.map((c) => ({
      chunkId: c.chunkId,
      documentId: c.documentId,
      excerpt: c.content.slice(0, 200),
    })),
  });
}
import Link from "next/link";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { ChatClient } from "./chat-client";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const { c: selectedConversationId } = await searchParams;

  const { data: conversations } = await supabaseAdmin
    .from("conversations")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  let initialMessages: any[] = [];

  if (selectedConversationId) {
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("user_id")
      .eq("id", selectedConversationId)
      .single();

    if (conv?.user_id === userId) {
      const { data: messages } = await supabaseAdmin
        .from("messages")
        .select("id, role, content, feedback, retrieved_chunk_ids")
        .eq("conversation_id", selectedConversationId)
        .order("created_at", { ascending: true });

      const allChunkIds = (messages ?? []).flatMap(
        (m) => m.retrieved_chunk_ids ?? [],
      );

      const { data: chunks } =
        allChunkIds.length > 0
          ? await supabaseAdmin
              .from("document_chunks")
              .select("id, document_id, content, documents(status)")
              .in("id", allChunkIds)
          : { data: [] };

      const chunkMap = new Map((chunks ?? []).map((c) => [c.id, c]));

      initialMessages = (messages ?? []).map((m) => ({
        role: m.role,
        content: m.content,
        messageId: m.id,
        feedback: m.feedback,
        sources: (m.retrieved_chunk_ids ?? []).map((chunkId: string) => {
          const chunk: any = chunkMap.get(chunkId);
          return {
            chunkId,
            documentId: chunk?.document_id ?? "",
            excerpt: chunk?.content?.slice(0, 200) ?? "",
            isDeleted: chunk?.documents?.status === "archived",
          };
        }),
      }));
    }
  }

  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r p-4 space-y-2 overflow-y-auto">
        <Link href="/chat" className="block font-medium mb-4">
          + Nouvelle conversation
        </Link>
        {conversations?.map((conv) => (
          <Link
            key={conv.id}
            href={`/chat?c=${conv.id}`}
            className={`block text-sm truncate p-2 rounded ${
              conv.id === selectedConversationId
                ? "bg-gray-200"
                : "hover:bg-gray-100"
            }`}
          >
            {new Date(conv.created_at).toLocaleString()}
          </Link>
        ))}
      </aside>
      <div className="flex-1">
        <ChatClient
          key={selectedConversationId ?? "new"}
          conversationId={selectedConversationId ?? null}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { ChatClient } from "./chat-client";
import { PenSquare, Clock, ChevronDown } from "lucide-react";

export const metadata = {
  title: "Chat",
};

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

  /* ── Regroupement des conversations par période ── */
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  type Conversation = NonNullable<typeof conversations>[number];
  const grouped: { label: string; items: Conversation[] | null }[] = [
    {
      label: "Aujourd'hui",
      items: conversations?.filter(
        (c) => new Date(c.created_at) >= todayStart,
      ) ?? null,
    },
    {
      label: "Hier",
      items: conversations?.filter(
        (c) =>
          new Date(c.created_at) >= yesterdayStart &&
          new Date(c.created_at) < todayStart,
      ) ?? null,
    },
    {
      label: "Cette semaine",
      items: conversations?.filter(
        (c) =>
          new Date(c.created_at) >= weekStart &&
          new Date(c.created_at) < yesterdayStart,
      ) ?? null,
    },
    {
      label: "Plus ancien",
      items: conversations?.filter(
        (c) => new Date(c.created_at) < weekStart,
      ) ?? null,
    },
  ].filter((g) => g.items && g.items.length > 0);

  const renderConversationList = () => (
    <>
      {grouped.length === 0 && (
        <p className="px-2 py-4 text-xs text-[#6B695E] text-center">
          Aucune conversation
        </p>
      )}
      {grouped.map((group) => (
        <div key={group.label} className="mb-3">
          <p className="px-2 py-1 text-[11px] font-500 text-[#6B695E] select-none">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items?.map((conv) => {
              const isSelected = conv.id === selectedConversationId;
              return (
                <li key={conv.id}>
                  <Link
                    href={`/chat?c=${conv.id}`}
                    aria-current={isSelected ? "true" : undefined}
                    className={[
                      "flex items-center gap-2 px-2 py-1.5 rounded text-xs zen-transition",
                      "focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1",
                      isSelected
                        ? "bg-[#EEF2F0] text-[#2D5D53] font-medium"
                        : "text-[#6B695E] hover:bg-[#EAE7E1] hover:text-[#1C2321]",
                    ].join(" ")}
                  >
                    <Clock
                      size={11}
                      strokeWidth={1.75}
                      className="shrink-0 opacity-50"
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      {new Date(conv.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* ── Historique - Mobile ── */}
      <div className="md:hidden shrink-0 bg-[#F7F5F0] border-b border-[#D6D2CB]">
        <details className="group">
          <summary className="flex items-center justify-between p-3 text-sm font-medium text-[#1C2321] cursor-pointer list-none select-none focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-[-2px]">
            <span className="flex items-center gap-2">
              <Clock size={15} strokeWidth={2} className="text-[#6B695E]" aria-hidden="true" />
              Historique des conversations
            </span>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className="text-[#6B695E] transition-transform duration-200 group-open:-rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="px-2 pb-3 border-t border-[#D6D2CB]/50 bg-white shadow-inner max-h-[40vh] overflow-y-auto">
            <div className="p-2">
              <Link
                href="/chat"
                className="
                  flex items-center justify-center gap-2
                  w-full px-3 py-2
                  rounded-md
                  bg-[#2D5D53] text-[#F7F5F0]
                  text-sm font-medium
                  hover:bg-[#245048]
                  zen-transition
                  focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-2
                "
              >
                <PenSquare size={14} strokeWidth={2} aria-hidden="true" />
                Nouvelle conversation
              </Link>
            </div>
            <nav aria-label="Liste des conversations (mobile)" className="p-1">
              {renderConversationList()}
            </nav>
          </div>
        </details>
      </div>

      {/* ── Panneau conversations (maître) - Desktop ── */}
      <aside
        className="
          w-[200px] shrink-0
          flex-col
          border-r border-[#D6D2CB]
          bg-[#F7F5F0]
          overflow-y-auto
          hidden md:flex
        "
        aria-label="Conversations"
      >
        {/* Bouton nouvelle conversation */}
        <div className="p-3 border-b border-[#D6D2CB]">
          <Link
            href="/chat"
            id="new-conversation-btn"
            className="
              flex items-center justify-center gap-2
              w-full px-3 py-2
              rounded-md
              bg-[#2D5D53] text-[#F7F5F0]
              text-sm font-medium
              hover:bg-[#245048]
              zen-transition
              focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-2
            "
          >
            <PenSquare size={14} strokeWidth={2} aria-hidden="true" />
            Nouveau
          </Link>
        </div>

        {/* Liste groupée */}
        <nav aria-label="Liste des conversations" className="flex-1 p-2">
          {renderConversationList()}
        </nav>
      </aside>

      {/* ── Zone de chat (détail) ── */}
      <div className="flex-1 overflow-hidden">
        <ChatClient
          key={selectedConversationId ?? "new"}
          conversationId={selectedConversationId ?? null}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { setFeedback } from "./actions";
import { Send, FileText, FileX, ThumbsUp, ThumbsDown } from "lucide-react";

interface Source {
  chunkId: string;
  documentId: string;
  excerpt: string;
  isDeleted?: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  messageId?: string;
  feedback?: "helpful" | "inaccurate" | null;
}

/* ── Composant bulle utilisateur ── */
function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="
          max-w-[70%] px-4 py-3
          border-l-2 border-[#2D5D53]
          bg-white
          rounded-r-md rounded-tl-md
          text-sm text-[#1C2321]
          shadow-[0_1px_3px_rgba(28,35,33,0.06)]
        "
      >
        {content}
      </div>
    </div>
  );
}

/* ── Composant source unique ── */
function SourceItem({
  source,
  index,
  onOpen,
}: {
  source: Source;
  index: number;
  onOpen: (documentId: string) => void;
}) {
  if (source.isDeleted) {
    return (
      <div className="flex items-start gap-2 text-xs text-[#6B695E]">
        <FileX
          size={13}
          strokeWidth={1.75}
          className="shrink-0 mt-0.5 text-[#D6D2CB]"
          aria-hidden="true"
        />
        <span>
          <span className="font-medium text-[#D6D2CB]">
            Source {index + 1}
          </span>{" "}
          — document archivé
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onOpen(source.documentId)}
      className="
        flex items-start gap-2 w-full text-left text-xs
        text-[#6B695E] hover:text-[#2D5D53]
        zen-transition group
        focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1 rounded
      "
      aria-label={`Ouvrir la source ${index + 1}`}
    >
      <FileText
        size={13}
        strokeWidth={1.75}
        className="shrink-0 mt-0.5 text-[#2D5D53] group-hover:text-[#245048]"
        aria-hidden="true"
      />
      <span className="line-clamp-2">
        <span className="font-medium text-[#2D5D53] group-hover:text-[#245048]">
          Source {index + 1}
        </span>{" "}
        — {source.excerpt.slice(0, 100)}
        {source.excerpt.length > 100 ? "…" : ""}
      </span>
    </button>
  );
}

/* ── Composant bulle assistant ── */
function AssistantBubble({
  message,
  index,
  onFeedback,
  onOpenDoc,
}: {
  message: Message;
  index: number;
  onFeedback: (index: number, value: "helpful" | "inaccurate") => void;
  onOpenDoc: (documentId: string) => void;
}) {
  const sources = message.sources ?? [];
  const validSources = sources.filter((s) => !s.isDeleted);
  const deletedCount = sources.length - validSources.length;

  return (
    <div className="flex justify-start max-w-[82%]">
      <div className="flex flex-col gap-3 w-full">
        {/* Corps de la réponse */}
        <div
          className="
            px-4 py-3
            bg-[#EEF2F0]
            rounded-md
            text-sm text-[#1C2321] leading-relaxed
            whitespace-pre-wrap
          "
        >
          {message.content}
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="px-1">
            <p className="text-[11px] font-medium text-[#6B695E] mb-1.5 select-none">
              {validSources.length} source{validSources.length !== 1 ? "s" : ""}
              {deletedCount > 0
                ? ` — ${deletedCount} archivé${deletedCount !== 1 ? "s" : ""}`
                : ""}
            </p>
            <div className="space-y-1.5">
              {sources.map((s, j) => (
                <SourceItem
                  key={s.chunkId}
                  source={s}
                  index={j}
                  onOpen={onOpenDoc}
                />
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {message.messageId && (
          <div className="flex items-center gap-1 px-1">
            <button
              onClick={() => onFeedback(index, "helpful")}
              aria-label="Marquer comme utile"
              aria-pressed={message.feedback === "helpful"}
              className={[
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs zen-transition",
                "focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1",
                message.feedback === "helpful"
                  ? "bg-[#EEF2F0] text-[#2D5D53] font-medium"
                  : "text-[#6B695E] hover:bg-[#EAE7E1] hover:text-[#1C2321]",
              ].join(" ")}
            >
              <ThumbsUp size={12} strokeWidth={2} aria-hidden="true" />
              Utile
            </button>
            <button
              onClick={() => onFeedback(index, "inaccurate")}
              aria-label="Marquer comme inexact"
              aria-pressed={message.feedback === "inaccurate"}
              className={[
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs zen-transition",
                "focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1",
                message.feedback === "inaccurate"
                  ? "bg-[#FAEAEA] text-[#B54A45] font-medium"
                  : "text-[#6B695E] hover:bg-[#EAE7E1] hover:text-[#1C2321]",
              ].join(" ")}
            >
              <ThumbsDown size={12} strokeWidth={2} aria-hidden="true" />
              Inexact
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Indicateur de chargement ── */
function LoadingIndicator() {
  return (
    <div className="flex justify-start" aria-live="polite" aria-label="Réponse en cours">
      <div className="px-4 py-3 bg-[#EEF2F0] rounded-md">
        <span className="loading-dots text-[#6B695E] text-xs" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="sr-only">Réflexion en cours…</span>
      </div>
    </div>
  );
}

/* ── État vide ── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-10 h-10 rounded-full bg-[#EEF2F0] flex items-center justify-center mb-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 28 28"
          fill="none"
          aria-hidden="true"
        >
          <line x1="5" y1="7" x2="23" y2="7" stroke="#2D5D53" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="8" x2="6" y2="20" stroke="#2D5D53" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="5" y1="21" x2="23" y2="21" stroke="#2D5D53" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[#1C2321] mb-1">
        Posez une question
      </p>
      <p className="text-xs text-[#6B695E] max-w-[280px] leading-relaxed">
        Interrogez la base documentaire de votre organisation — politiques,
        procédures, notes internes.
      </p>
    </div>
  );
}

/* ── Composant principal ── */
export function ChatClient({
  conversationId: initialConversationId,
  initialMessages,
}: {
  conversationId: string | null;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId,
  );
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* Défilement automatique */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFeedback = async (
    index: number,
    feedback: "helpful" | "inaccurate",
  ) => {
    const msg = messages[index];
    if (!msg.messageId) return;
    await setFeedback(msg.messageId, feedback);
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, feedback } : m)),
    );
  };

  const openDocument = async (documentId: string) => {
    const res = await fetch(`/api/documents/${documentId}/url`);
    const data = await res.json();
    if (!res.ok) {
      alert(`Erreur : ${data.error}`);
      return;
    }
    window.open(data.url, "_blank");
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, conversationId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Erreur : ${data.error}` },
      ]);
      return;
    }

    setConversationId(data.conversationId);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        messageId: data.messageId,
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Fil de messages ── */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
      >
        {messages.length === 0 && !loading && <EmptyState />}

        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserBubble key={i} content={msg.content} />
          ) : (
            <AssistantBubble
              key={i}
              message={msg}
              index={i}
              onFeedback={handleFeedback}
              onOpenDoc={openDocument}
            />
          ),
        )}

        {loading && <LoadingIndicator />}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* ── Zone de saisie ── */}
      <div className="border-t border-[#D6D2CB] px-4 py-3 bg-[#F7F5F0]">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <label htmlFor="chat-input" className="sr-only">
            Votre question
          </label>
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              /* Hauteur auto — max 5 lignes */
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question sur vos documents…"
            rows={1}
            disabled={loading}
            className="
              flex-1 resize-none
              px-3.5 py-2.5
              rounded-md
              border border-[#D6D2CB]
              bg-white
              text-sm text-[#1C2321]
              placeholder:text-[#6B695E]/60
              focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-0
              disabled:opacity-50
              transition-[height] duration-100
            "
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Envoyer la question"
            className="
              flex items-center justify-center
              w-[42px] h-[42px] shrink-0
              rounded-md
              bg-[#2D5D53] text-[#F7F5F0]
              hover:bg-[#245048]
              disabled:opacity-40 disabled:cursor-not-allowed
              zen-transition
              focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-2
            "
          >
            <Send size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <p className="text-center text-[10px] text-[#6B695E]/50 mt-2 select-none">
          Entrée pour envoyer — Maj+Entrée pour un saut de ligne
        </p>
      </div>
    </div>
  );
}

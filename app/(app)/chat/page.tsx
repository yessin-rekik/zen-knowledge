"use client";

import { useState } from "react";
import { setFeedback } from "./actions";

interface Source {
  chunkId: string;
  documentId: string;
  excerpt: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  messageId?: string;
  feedback?: "helpful" | "inaccurate";
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


const handleFeedback = async (index: number, feedback: "helpful" | "inaccurate") => {
  const msg = messages[index];
  if (!msg.messageId) return;

  await setFeedback(msg.messageId, feedback);
  setMessages((prev) =>
    prev.map((m, i) => (i === index ? { ...m, feedback } : m))
  );
};

const openDocument = async (documentId: string) => {
  const res = await fetch(`/api/documents/${documentId}/url`);
  const data = await res.json();

  if (!res.ok) {
    alert(`Erreur: ${data.error}`);
    return;
  }

  window.open(data.url, "_blank");
};

  const handleSend = async () => {
    if (!input.trim()) return;

    const question = input;
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
      setMessages((prev) => [...prev, { role: "assistant", content: `Erreur: ${data.error}` }]);
      return;
    }

    setConversationId(data.conversationId);
    setMessages((prev) => [
  ...prev,
  { role: "assistant", content: data.answer, sources: data.sources, messageId: data.messageId },
]);
  };

  return (
    <div className="mx-auto max-w-2xl p-6 flex flex-col h-screen">
      <h1 className="text-xl font-semibold mb-4">Chat</h1>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <p className="inline-block rounded px-3 py-2 bg-gray-100 max-w-md">{msg.content}</p>
            {msg.sources && msg.sources.length > 0 && (
  <div className="mt-1 text-xs text-gray-500 space-y-1">
    {msg.sources.map((s, j) => (
      <button
        key={j}
        onClick={() => openDocument(s.documentId)}
        className="block text-left underline hover:text-blue-600"
      >
        [Source {j + 1}] {s.excerpt.slice(0, 80)}...
      </button>
    ))}
  </div>
)}
            {msg.role === "assistant" && msg.messageId && (
  <div className="mt-1 flex gap-2 text-sm">
    <button
      onClick={() => handleFeedback(i, "helpful")}
      className={msg.feedback === "helpful" ? "opacity-100" : "opacity-40"}
    >
      👍
    </button>
    <button
      onClick={() => handleFeedback(i, "inaccurate")}
      className={msg.feedback === "inaccurate" ? "opacity-100" : "opacity-40"}
    >
      👎
    </button>
  </div>
)}
          </div>
        ))}
        {loading && <p className="text-gray-400">Réflexion...</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Pose une question..."
          className="flex-1 rounded border px-3 py-2"
        />
        <button onClick={handleSend} className="rounded bg-black px-4 py-2 text-white">
          Envoyer
        </button>
      </div>
    </div>
  );
}
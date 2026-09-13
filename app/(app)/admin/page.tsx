import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import Link from "next/link";
import {
  DollarSign,
  SearchX,
  ThumbsDown,
  AlertTriangle,
  MessageSquare,
  Gauge,
  FileText,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getEffectiveCompanyId } from "@/lib/context";
import { QuestionsPanel } from "./questions-panel";

export const metadata = {
  title: "Administration",
};

// Prix indicatif Groq pour openai/gpt-oss-20b
const PRICE_PER_1M_INPUT = 0.075;
const PRICE_PER_1M_OUTPUT = 0.3;

/* ── Carte KPI ── */
interface KpiCardProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  accentColor?: "neutral" | "amber" | "error";
}

function KpiCard({
  value,
  label,
  icon,
  accentColor = "neutral",
}: KpiCardProps) {
  const barColor = {
    neutral: "bg-[#D6D2CB]",
    amber: "bg-[#C08A3E]",
    error: "bg-[#B54A45]",
  }[accentColor];

  return (
    <div className="flex gap-3 items-start p-4 bg-white rounded-lg border border-[#D6D2CB]">
      <div
        className={`w-1 self-stretch rounded-sm ${barColor}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-700 text-[#1C2321] leading-none mb-1">
          {value}
        </p>
        <p className="text-xs text-[#6B695E]">{label}</p>
      </div>
      <div className="text-[#6B695E]/50 mt-0.5" aria-hidden="true">
        {icon}
      </div>
    </div>
  );
}

/* ── Section de liste ── */
function SectionList({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="flex items-baseline gap-2 mb-3">
        <h2>{title}</h2>
        <span className="text-xs text-[#6B695E]">{count}</span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-[#6B695E] py-4 text-center border border-dashed border-[#D6D2CB] rounded-lg">
          Aucun élément
        </p>
      ) : (
        <ul className="divide-y divide-[#D6D2CB] rounded-lg border border-[#D6D2CB] bg-white overflow-hidden">
          {children}
        </ul>
      )}
    </section>
  );
}

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role;
  if (role !== "admin" && role !== "group_admin") {
    redirect("/chat");
  }
  const companyId = await getEffectiveCompanyId(user);
  if (!companyId) {
    redirect("/group");
  }
  const { data: companyUsers } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("company_id", companyId);

  const userIds = (companyUsers ?? []).map((u) => u.id);

  const { data: logs } = await supabaseAdmin
    .from("query_logs")
    .select(
      "id, latency_ms, tokens_in, tokens_out, retrieved_doc_ids, message_id, question, created_at",
    )
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  const { data: negativeFeedback } = await supabaseAdmin
    .from("query_logs")
    .select("id, question, created_at, messages(content)")
    .in("user_id", userIds)
    .eq("messages.feedback", "inaccurate")
    .not("message_id", "is", null)
    .order("created_at", { ascending: false });

  const noResultLogs = (logs ?? []).filter(
    (l) => (l.retrieved_doc_ids ?? []).length === 0,
  );

  const totalTokensIn = (logs ?? []).reduce(
    (sum, l) => sum + (l.tokens_in ?? 0),
    0,
  );
  const totalTokensOut = (logs ?? []).reduce(
    (sum, l) => sum + (l.tokens_out ?? 0),
    0,
  );
  const estimatedCost =
    (totalTokensIn / 1_000_000) * PRICE_PER_1M_INPUT +
    (totalTokensOut / 1_000_000) * PRICE_PER_1M_OUTPUT;

  const totalQuestions = logs?.length ?? 0;

  const feedbackGiven = (logs ?? []).filter((l: any) => l.messages?.feedback);
  // Note : query_logs n'a pas de jointure messages par défaut dans le select actuel,
  // donc on va chercher séparément les feedbacks positifs/négatifs
  const { data: allFeedback } = await supabaseAdmin
    .from("messages")
    .select("feedback, conversation_id, conversations!inner(user_id)")
    .in("conversations.user_id", userIds)
    .not("feedback", "is", null);

  const positiveFeedback = (allFeedback ?? []).filter(
    (m: any) => m.feedback === "helpful",
  ).length;
  const totalFeedback = allFeedback?.length ?? 0;
  const satisfactionRate =
    totalFeedback > 0
      ? Math.round((positiveFeedback / totalFeedback) * 100)
      : null;

  const avgLatency =
    totalQuestions > 0
      ? Math.round(
          (logs ?? []).reduce(
            (sum: number, l: any) => sum + (l.latency_ms ?? 0),
            0,
          ) / totalQuestions,
        )
      : 0;

  // Document le plus cité
  const docCitationCount: Record<string, number> = {};
  (logs ?? []).forEach((l: any) => {
    (l.retrieved_doc_ids ?? []).forEach((docId: string) => {
      docCitationCount[docId] = (docCitationCount[docId] ?? 0) + 1;
    });
  });
  const topDocId = Object.entries(docCitationCount).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  let topDocTitle: string | null = null;
  if (topDocId) {
    const { data: topDoc } = await supabaseAdmin
      .from("documents")
      .select("title")
      .eq("id", topDocId)
      .single();
    topDocTitle = topDoc?.title ?? null;
  }

  const { data: obsoleteDocuments } = await supabaseAdmin
    .from("documents")
    .select("id, title, date_revision, status")
    .eq("company_id", companyId)
    .lt("date_revision", new Date().toISOString())
    .neq("status", "archived");

  const negCount = negativeFeedback?.length ?? 0;
  const obsCount = obsoleteDocuments?.length ?? 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        <h1>Tableau de bord</h1>

        {/* ── Grille KPI 2×2 ── */}
        <section aria-label="Indicateurs clés">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard
              value={`$${estimatedCost.toFixed(4)}`}
              label="Coût estimé (indicatif Groq)"
              icon={<DollarSign size={18} strokeWidth={1.5} />}
              accentColor="neutral"
            />
            <KpiCard
              value={noResultLogs.length}
              label="Questions sans résultat"
              icon={<SearchX size={18} strokeWidth={1.5} />}
              accentColor={noResultLogs.length > 0 ? "amber" : "neutral"}
            />
            <KpiCard
              value={negCount}
              label="Réponses marquées inexactes"
              icon={<ThumbsDown size={18} strokeWidth={1.5} />}
              accentColor={negCount > 0 ? "amber" : "neutral"}
            />
            <KpiCard
              value={obsCount}
              label="Documents à réviser"
              icon={<AlertTriangle size={18} strokeWidth={1.5} />}
              accentColor={obsCount > 0 ? "amber" : "neutral"}
            />
            <KpiCard
              value={totalQuestions}
              label="Questions posées au total"
              icon={<MessageSquare size={18} strokeWidth={1.5} />}
              accentColor="neutral"
            />
            <KpiCard
              value={satisfactionRate !== null ? `${satisfactionRate}%` : "—"}
              label="Taux de satisfaction"
              icon={<ThumbsDown size={18} strokeWidth={1.5} />}
              accentColor={
                satisfactionRate !== null && satisfactionRate < 50
                  ? "error"
                  : "neutral"
              }
            />
            <KpiCard
              value={`${avgLatency} ms`}
              label="Latence moyenne"
              icon={<Gauge size={18} strokeWidth={1.5} />}
              accentColor="neutral"
            />
          </div>

          {/* Détail coût */}
          <p className="mt-2 text-xs text-[#6B695E]">
            {totalTokensIn.toLocaleString("fr-FR")} tokens en entrée —{" "}
            {totalTokensOut.toLocaleString("fr-FR")} tokens en sortie
          </p>

          {topDocTitle && (
            <p className="mt-1 text-xs text-[#6B695E] flex items-center gap-1.5">
              <FileText size={13} strokeWidth={1.75} aria-hidden="true" />
              Document le plus cité :{" "}
              <span className="font-medium text-[#1C2321]">{topDocTitle}</span>
            </p>
          )}
        </section>

        {/* ── Questions sans résultat ── */}
        <QuestionsPanel
  title="Questions sans résultat"
  entries={noResultLogs.map((l: any) => ({
    id: l.id,
    question: l.question,
    created_at: l.created_at,
    latency_ms: l.latency_ms,
  }))}
  showLatency
/>

        {/* ── Feedback négatifs ── */}
        <QuestionsPanel
  title="Réponses inexactes"
  entries={(negativeFeedback ?? []).map((l: any) => ({
    id: l.id,
    question: l.question,
    created_at: l.created_at,
    content: l.messages?.content,
  }))}
/>

        {/* ── Documents obsolètes ── */}
        <SectionList title="Documents à réviser" count={obsCount}>
          {(obsoleteDocuments ?? []).map((d) => (
            <li
              key={d.id}
              className="px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-1 h-6 rounded-sm bg-[#C08A3E] shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-[#1C2321] truncate">
                  {d.title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-[#6B695E]">
                <span>
                  révision{" "}
                  {new Date(d.date_revision).toLocaleDateString("fr-FR")}
                </span>
                <Link
                  href="/library"
                  className="
                    text-[#2D5D53] hover:text-[#245048]
                    zen-transition
                    focus-visible:outline-2 focus-visible:outline-[#2D5D53] focus-visible:outline-offset-1 rounded
                  "
                >
                  Gérer
                </Link>
              </div>
            </li>
          ))}
        </SectionList>
      </div>
    </div>
  );
}

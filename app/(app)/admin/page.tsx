import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";

// Prix indicatif Groq pour openai/gpt-oss-20b (à titre d'estimation, pas une facturation réelle)
const PRICE_PER_1M_INPUT = 0.075;
const PRICE_PER_1M_OUTPUT = 0.30;

export default async function AdminPage() {
  const session = await auth();
  const companyId = (session?.user as any)?.companyId;

  // Récupère tous les user_id de la société pour filtrer les logs/messages
  const { data: companyUsers } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("company_id", companyId);

  const userIds = (companyUsers ?? []).map((u) => u.id);

  const { data: logs } = await supabaseAdmin
    .from("query_logs")
    .select("id, latency_ms, tokens_in, tokens_out, retrieved_doc_ids, message_id, created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  const { data: negativeFeedback } = await supabaseAdmin
    .from("messages")
    .select("id, content, created_at")
    .eq("feedback", "inaccurate")
    .in(
      "conversation_id",
      (
        await supabaseAdmin.from("conversations").select("id").in("user_id", userIds)
      ).data?.map((c) => c.id) ?? []
    );

  const noResultLogs = (logs ?? []).filter((l) => (l.retrieved_doc_ids ?? []).length === 0);

  const totalTokensIn = (logs ?? []).reduce((sum, l) => sum + (l.tokens_in ?? 0), 0);
  const totalTokensOut = (logs ?? []).reduce((sum, l) => sum + (l.tokens_out ?? 0), 0);
  const estimatedCost =
    (totalTokensIn / 1_000_000) * PRICE_PER_1M_INPUT +
    (totalTokensOut / 1_000_000) * PRICE_PER_1M_OUTPUT;

  const { data: obsoleteDocuments } = await supabaseAdmin
    .from("documents")
    .select("id, title, date_revision, status")
    .eq("company_id", companyId)
    .lt("date_revision", new Date().toISOString())
    .neq("status", "archived");

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="text-xl font-semibold">Dashboard admin</h1>

      <section>
        <h2 className="font-medium mb-2">Coût estimé (indicatif)</h2>
        <p className="text-sm text-gray-600">
          {totalTokensIn} tokens entrée, {totalTokensOut} tokens sortie — environ{" "}
          <strong>${estimatedCost.toFixed(4)}</strong> (tarif indicatif Groq, gpt-oss-20b)
        </p>
      </section>

      <section>
        <h2 className="font-medium mb-2">Questions sans résultat ({noResultLogs.length})</h2>
        <ul className="text-sm space-y-1">
          {noResultLogs.slice(0, 10).map((l) => (
            <li key={l.id} className="text-gray-600">
              {new Date(l.created_at).toLocaleString()} — latence {l.latency_ms}ms
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">Feedback négatifs ({negativeFeedback?.length ?? 0})</h2>
        <ul className="text-sm space-y-1">
          {(negativeFeedback ?? []).slice(0, 10).map((m) => (
            <li key={m.id} className="text-gray-600">
              {new Date(m.created_at).toLocaleString()} — {m.content.slice(0, 100)}...
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">
          Documents obsolètes/à réviser ({obsoleteDocuments?.length ?? 0})
        </h2>
        <ul className="text-sm space-y-1">
          {(obsoleteDocuments ?? []).map((d) => (
            <li key={d.id} className="text-gray-600">
              {d.title} — révision due le {d.date_revision} — statut: {d.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
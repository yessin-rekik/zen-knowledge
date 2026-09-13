import "server-only";
import { supabaseAdmin } from "./db";

export async function logAudit(params: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}) {
  await supabaseAdmin.from("audit_log").insert({
    actor_id: params.actorId,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? null,
  });
}
import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkflowStep = { step_no: number; approver_role: string };

/**
 * The most recent active workflow definition for a module, with its steps
 * in order. Returns null if the company hasn't defined one — callers
 * should fall back to the old immediate-decision behavior in that case,
 * so this is opt-in per company/module rather than a breaking change.
 */
export async function getActiveWorkflow(
  supabase: SupabaseClient,
  companyId: string,
  moduleName: string
): Promise<{ id: string; steps: WorkflowStep[] } | null> {
  const { data: workflow } = await supabase
    .from("workflows")
    .select("id, workflow_steps(step_no, approver_role)")
    .eq("company_id", companyId)
    .eq("module_name", moduleName)
    .eq("active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!workflow || !workflow.workflow_steps || workflow.workflow_steps.length === 0) return null;

  return {
    id: workflow.id,
    steps: [...workflow.workflow_steps].sort((a: any, b: any) => a.step_no - b.step_no)
  };
}

/** Creates one pending workflow_approvals row per step for this entity. */
export async function startApprovalChain(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string,
  workflow: { id: string; steps: WorkflowStep[] }
) {
  await supabase.from("workflow_approvals").insert(
    workflow.steps.map((s) => ({
      entity_type: entityType,
      entity_id: entityId,
      workflow_id: workflow.id,
      step_no: s.step_no,
      approver_role: s.approver_role,
      approved: false
    }))
  );
}

/** All approval-chain rows for an entity, in step order (empty if none — i.e. no workflow was active when it was submitted). */
export async function getApprovalSteps(supabase: SupabaseClient, entityType: string, entityId: string) {
  const { data } = await supabase
    .from("workflow_approvals")
    .select("id, step_no, approver_role, approved, approved_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("step_no");
  return data ?? [];
}

/**
 * Advances a multi-step chain by one decision.
 *   - "rejected" ends the chain immediately regardless of which step it's at.
 *   - "approved" marks the current (lowest unapproved step_no) row done; if
 *     that was the last step the whole entity is now approved, otherwise
 *     it stays pending for the next step's approver.
 * Returns the entity-level status to write ("approved" | "rejected" | "pending"),
 * or null if there was no pending step to decide (already resolved, or the
 * caller should fall back to the no-workflow path).
 */
export async function decideCurrentStep(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string,
  decision: "approved" | "rejected",
  approvedBy: string | undefined
): Promise<"approved" | "rejected" | "pending" | null> {
  const steps = await getApprovalSteps(supabase, entityType, entityId);
  if (steps.length === 0) return null;

  const current = steps.find((s) => !s.approved);
  if (!current) return null; // chain already fully resolved

  if (decision === "rejected") {
    return "rejected";
  }

  await supabase
    .from("workflow_approvals")
    .update({ approved: true, approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq("id", current.id);

  const remaining = steps.filter((s) => s.step_no > current.step_no && !s.approved);
  return remaining.length === 0 ? "approved" : "pending";
}

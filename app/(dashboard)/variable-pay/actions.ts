"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveWorkflow, startApprovalChain, decideCurrentStep, getApprovalSteps } from "@/lib/workflow";

export async function allocateVariablePay(formData: FormData) {
  const supabase = createClient();
  const employee_id = String(formData.get("employee_id") ?? "");

  const { data: allocation, error } = await supabase
    .from("variable_pay")
    .insert({
      employee_id,
      variable_type: String(formData.get("variable_type") ?? ""),
      allocated_amount: Number(formData.get("allocated_amount") ?? 0),
      approved_amount: 0,
      payout_amount: 0
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/variable-pay?error=${encodeURIComponent(error.message)}`);
  }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", employee_id).maybeSingle();
  if (employee?.company_id) {
    const workflow = await getActiveWorkflow(supabase, employee.company_id, "variable_pay");
    if (workflow) {
      await startApprovalChain(supabase, "variable_pay", allocation!.id, workflow);
    }
  }

  revalidatePath("/variable-pay");
}

export async function approveVariablePay(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = String(formData.get("id") ?? "");
  const approved_amount = Number(formData.get("approved_amount") ?? 0);

  // variable_pay has no reject concept in this UI (no status column) - the
  // only decision that exists here is "approve this step". If a chain is
  // active, only advance/finalize it once the *last* step approves; the
  // approved_amount the admin enters is only persisted at that point, same
  // as reimbursements only persist the final approver's figure.
  const steps = await getApprovalSteps(supabase, "variable_pay", id);
  if (steps.length > 0) {
    const result = await decideCurrentStep(supabase, "variable_pay", id, "approved", user?.id);
    if (result !== "approved") {
      revalidatePath("/variable-pay");
      return;
    }
  }

  const { error } = await supabase.from("variable_pay").update({ approved_amount }).eq("id", id);
  if (error) {
    redirect(`/variable-pay?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/variable-pay");
}

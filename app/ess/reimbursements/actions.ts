"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getActiveWorkflow, startApprovalChain } from "@/lib/workflow";

export async function submitMyClaim(formData: FormData) {
  const supabase = createClient();
  const { employeeId } = await resolveCompanyId(supabase);

  if (!employeeId) {
    redirect(`/ess/reimbursements?error=${encodeURIComponent("No employee profile found")}`);
  }

  const { data: claim, error } = await supabase
    .from("reimbursements")
    .insert({
      employee_id: employeeId,
      claim_type: String(formData.get("claim_type") ?? ""),
      claim_amount: Number(formData.get("claim_amount") ?? 0),
      status: "pending"
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/ess/reimbursements?error=${encodeURIComponent(error.message)}`);
  }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", employeeId).maybeSingle();
  if (employee?.company_id) {
    const workflow = await getActiveWorkflow(supabase, employee.company_id, "reimbursement");
    if (workflow) {
      await startApprovalChain(supabase, "reimbursement", claim!.id, workflow);
    }
  }

  revalidatePath("/ess/reimbursements");
}

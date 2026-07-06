"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getActiveWorkflow, startApprovalChain } from "@/lib/workflow";

export async function applyMyLeave(formData: FormData) {
  const supabase = createClient();
  const { employeeId } = await resolveCompanyId(supabase);

  if (!employeeId) {
    redirect(`/ess/leave?error=${encodeURIComponent("No employee profile found")}`);
  }

  const from_date = String(formData.get("from_date") ?? "");
  const to_date = String(formData.get("to_date") ?? "");
  if (new Date(to_date) < new Date(from_date)) {
    redirect(`/ess/leave?error=${encodeURIComponent("To date can't be before from date")}`);
  }

  const { data: application, error } = await supabase
    .from("leave_applications")
    .insert({
      employee_id: employeeId,
      leave_type_id: String(formData.get("leave_type_id") ?? ""),
      from_date,
      to_date,
      status: "pending"
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/ess/leave?error=${encodeURIComponent(error.message)}`);
  }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", employeeId).maybeSingle();
  if (employee?.company_id) {
    const workflow = await getActiveWorkflow(supabase, employee.company_id, "leave");
    if (workflow) {
      await startApprovalChain(supabase, "leave", application!.id, workflow);
    }
  }

  revalidatePath("/ess/leave");
}

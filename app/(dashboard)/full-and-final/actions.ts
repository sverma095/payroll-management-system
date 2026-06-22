"use server";

import { createClient } from "@/lib/supabase/server";
import { computeFullAndFinal } from "@/lib/payroll/full-and-final";
import { getComponentValue } from "@/lib/payroll/breakdown";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function initiateFullAndFinal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const employeeId = String(formData.get("employee_id") ?? "");
  const relievingDate = String(formData.get("relieving_date") ?? "");
  const unusedLeaveDays = Number(formData.get("unused_leave_days") ?? 0);
  const noticePayRecovery = Number(formData.get("notice_pay_recovery") ?? 0);

  const { data: employee } = await supabase
    .from("employees")
    .select("id, doj, company_id")
    .eq("id", employeeId)
    .single();

  if (!employee) {
    redirect(`/full-and-final?error=${encodeURIComponent("Employee not found")}`);
  }

  const { data: assignment } = await supabase
    .from("employee_salary_assignments")
    .select("monthly_gross, salary_structure_id")
    .eq("employee_id", employeeId)
    .is("effective_to", null)
    .maybeSingle();

  if (!assignment) {
    redirect(`/full-and-final?error=${encodeURIComponent("No salary structure assigned to this employee")}`);
  }

  // Use the most recent payroll's computed Basic if there is one, else fall
  // back to the structure's standard 50% convention against monthly_gross.
  const { data: lastPayrollDetail } = await supabase
    .from("payroll_details")
    .select("breakdown_json")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const monthlyGross = Number(assignment!.monthly_gross);
  const basic = getComponentValue(lastPayrollDetail?.breakdown_json as any, "BASIC") || monthlyGross * 0.5;

  const { data: loans } = await supabase
    .from("loans")
    .select("outstanding_balance")
    .eq("employee_id", employeeId)
    .eq("status", "active");
  const outstandingLoanBalance = (loans ?? []).reduce((sum, l) => sum + Number(l.outstanding_balance), 0);

  const result = computeFullAndFinal({
    doj: new Date(employee!.doj),
    relievingDate: new Date(relievingDate),
    monthlyGross,
    basic,
    unusedLeaveDays,
    outstandingLoanBalance,
    noticePayRecovery
  });

  const { error } = await supabase.from("full_and_final").insert({
    employee_id: employeeId,
    salary_amount: result.salaryAmount,
    leave_encashment: result.leaveEncashment,
    gratuity: result.gratuity,
    recoveries: result.recoveries,
    notice_pay: result.noticePay,
    net_payable: result.netPayable,
    status: "draft"
  });

  if (error) {
    redirect(`/full-and-final?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("employees").update({ status: "relieved" }).eq("id", employeeId);

  await supabase.from("audit_logs").insert({
    user_id: user?.id,
    module_name: "full_and_final",
    action: "initiate_fnf",
    new_value_json: { employeeId, ...result }
  });

  revalidatePath("/full-and-final");
  revalidatePath("/employees");
}

export async function approveFullAndFinal(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");

  await supabase.from("full_and_final").update({ status: "approved" }).eq("id", id);

  const { data: row } = await supabase.from("full_and_final").select("employee_id").eq("id", id).maybeSingle();
  if (row) {
    await supabase.from("employees").update({ status: "ff_completed" }).eq("id", row.employee_id);
  }

  revalidatePath("/full-and-final");
}

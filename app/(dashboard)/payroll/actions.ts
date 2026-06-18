"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { runPayroll } from "@/lib/payroll/process";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function processPayroll(formData: FormData) {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect(`/payroll?error=${encodeURIComponent("Create a company first")}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const result = await runPayroll(supabase, companyId!, year, month, user?.id ?? null);

  if (!result.ok) {
    const summary = result.issues.slice(0, 8).map((i) => `${i.employeeCode || ""}: ${i.message}`).join(" | ");
    redirect(`/payroll?year=${year}&month=${month}&error=${encodeURIComponent(summary)}`);
  }

  await supabase.from("audit_logs").insert({
    user_id: user?.id,
    module_name: "payroll_processing",
    action: "process_payroll",
    old_value_json: null,
    new_value_json: { year, month, processedCount: result.processedCount, headerId: result.headerId }
  });

  revalidatePath("/payroll");
  redirect(`/payroll?year=${year}&month=${month}`);
}

async function setPayrollStatus(headerId: string, status: "approved" | "locked", redirectQuery: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const update: Record<string, unknown> = { status };
  if (status === "approved") {
    update.approved_by = user?.id;
    update.approved_on = new Date().toISOString();
  }

  const { error } = await supabase.from("payroll_headers").update(update).eq("id", headerId);
  if (error) {
    redirect(`/payroll?${redirectQuery}&error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_logs").insert({
    user_id: user?.id,
    module_name: "payroll_processing",
    action: `payroll_${status}`,
    old_value_json: null,
    new_value_json: { headerId }
  });

  revalidatePath("/payroll");
}

export async function approvePayroll(formData: FormData) {
  const headerId = String(formData.get("header_id") ?? "");
  const year = String(formData.get("year") ?? "");
  const month = String(formData.get("month") ?? "");
  await setPayrollStatus(headerId, "approved", `year=${year}&month=${month}`);
  redirect(`/payroll?year=${year}&month=${month}`);
}

export async function lockPayroll(formData: FormData) {
  const headerId = String(formData.get("header_id") ?? "");
  const year = String(formData.get("year") ?? "");
  const month = String(formData.get("month") ?? "");
  await setPayrollStatus(headerId, "locked", `year=${year}&month=${month}`);
  redirect(`/payroll?year=${year}&month=${month}`);
}

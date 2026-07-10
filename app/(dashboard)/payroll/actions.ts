"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { runPayroll, checkPayrollReadiness } from "@/lib/payroll/process";
import { sendEmail } from "@/lib/email/send";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function processPayroll(formData: FormData) {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  const supabase = createClient();
  const { companyId, tenantId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect(`/payroll?error=${encodeURIComponent("Create a company first")}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const startedAt = Date.now();
  const result = await runPayroll(supabase, companyId!, year, month, user?.id ?? null);
  const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(3);

  if (!result.ok) {
    const summary = result.issues.slice(0, 8).map((i) => `${i.employeeCode || ""}: ${i.message}`).join(" | ");
    redirect(`/payroll?year=${year}&month=${month}&error=${encodeURIComponent(summary)}`);
  }

  await supabase.from("audit_logs").insert({
    user_id: user?.id,
    tenant_id: tenantId,
    module_name: "payroll_processing",
    action: "process_payroll",
    old_value_json: null,
    new_value_json: {
      year,
      month,
      processedCount: result.processedCount,
      headerId: result.headerId,
      durationSeconds: Number(durationSeconds),
      description: `Took ${durationSeconds} seconds for ${result.processedCount} employees.`
    }
  });

  if (user?.email) {
    await sendEmail(
      user.email,
      `Payroll processed: ${month}/${year}`,
      `<p>Payroll for ${month}/${year} processed successfully. ${result.processedCount} employees included.</p>`
    );
  }

  revalidatePath("/payroll");
  redirect(`/payroll?year=${year}&month=${month}`);
}

export async function runPrePayrollCheck(formData: FormData) {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect(`/payroll?error=${encodeURIComponent("Create a company first")}`);
  }

  const readiness = await checkPayrollReadiness(supabase, companyId!, year, month);
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  params.set("checkCount", String(readiness.employeeCount));
  params.set("checkBlocking", JSON.stringify(readiness.blocking.slice(0, 10)));
  params.set("checkWarnings", JSON.stringify(readiness.warnings.slice(0, 10)));
  redirect(`/payroll?${params.toString()}`);
}

async function setPayrollStatus(headerId: string, status: "approved" | "locked", redirectQuery: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { tenantId } = await resolveCompanyId(supabase);

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
    tenant_id: tenantId,
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

export async function payoutPayroll(formData: FormData) {
  const headerId = String(formData.get("header_id") ?? "");
  const year = String(formData.get("year") ?? "");
  const month = String(formData.get("month") ?? "");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { tenantId } = await resolveCompanyId(supabase);

  const { error } = await supabase
    .from("payroll_headers")
    .update({ status: "paid", paid_by: user?.id, paid_on: new Date().toISOString() })
    .eq("id", headerId);

  if (error) {
    redirect(`/payroll?year=${year}&month=${month}&error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_logs").insert({
    user_id: user?.id,
    tenant_id: tenantId,
    module_name: "payroll_processing",
    action: "payroll_paid",
    old_value_json: null,
    new_value_json: { headerId }
  });

  revalidatePath("/payroll");
  redirect(`/payroll?year=${year}&month=${month}`);
}

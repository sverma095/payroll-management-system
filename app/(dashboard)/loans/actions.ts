"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function issueLoan(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { tenantId } = await resolveCompanyId(supabase);

  const employee_id = String(formData.get("employee_id") ?? "");
  const loan_amount = Number(formData.get("loan_amount") ?? 0);
  const interest_rate = Number(formData.get("interest_rate") ?? 0);
  const emi_amount = Number(formData.get("emi_amount") ?? 0);

  const { error } = await supabase.from("loans").insert({
    employee_id,
    loan_amount,
    interest_rate,
    emi_amount,
    outstanding_balance: loan_amount,
    status: "active"
  });

  if (error) {
    redirect(`/loans?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_logs").insert({
    user_id: user?.id,
    tenant_id: tenantId,
    module_name: "loans",
    action: "issue_loan",
    new_value_json: { employee_id, loan_amount, interest_rate, emi_amount }
  });

  revalidatePath("/loans");
}

export async function recordManualRepayment(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  const { data: loan } = await supabase.from("loans").select("outstanding_balance").eq("id", id).single();
  if (!loan) {
    redirect(`/loans?error=${encodeURIComponent("Loan not found")}`);
  }

  const newBalance = Math.max(0, Number(loan!.outstanding_balance) - amount);

  await supabase
    .from("loans")
    .update({ outstanding_balance: newBalance, status: newBalance === 0 ? "closed" : "active" })
    .eq("id", id);

  revalidatePath("/loans");
}

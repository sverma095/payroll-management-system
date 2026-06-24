"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function submitMyClaim(formData: FormData) {
  const supabase = createClient();
  const { employeeId } = await resolveCompanyId(supabase);

  if (!employeeId) {
    redirect(`/ess/reimbursements?error=${encodeURIComponent("No employee profile found")}`);
  }

  const { error } = await supabase.from("reimbursements").insert({
    employee_id: employeeId,
    claim_type: String(formData.get("claim_type") ?? ""),
    claim_amount: Number(formData.get("claim_amount") ?? 0),
    status: "pending"
  });

  if (error) {
    redirect(`/ess/reimbursements?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/ess/reimbursements");
}

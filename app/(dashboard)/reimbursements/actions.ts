"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyUser } from "@/lib/notify";
import { decideCurrentStep } from "@/lib/workflow";

export async function decideReimbursement(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? ""); // approved | rejected
  const approvedAmount = Number(formData.get("approved_amount") ?? 0);

  const chainResult = await decideCurrentStep(supabase, "reimbursement", id, decision as "approved" | "rejected", user?.id);
  const newStatus = chainResult ?? decision;

  const { error } = await supabase
    .from("reimbursements")
    .update({
      status: newStatus,
      approved_amount: newStatus === "approved" ? approvedAmount : 0
    })
    .eq("id", id);

  if (error) {
    redirect(`/reimbursements?error=${encodeURIComponent(error.message)}`);
  }

  if (newStatus !== "pending") {
    const { data: claim } = await supabase.from("reimbursements").select("employee_id").eq("id", id).maybeSingle();
    if (claim) {
      const { data: appUser } = await supabase.from("app_users").select("id").eq("employee_id", claim.employee_id).maybeSingle();
      if (appUser) {
        await notifyUser(supabase, appUser.id, `Reimbursement ${newStatus}`, `Your reimbursement claim was ${newStatus}.`);
      }
    }
  }

  revalidatePath("/reimbursements");
}

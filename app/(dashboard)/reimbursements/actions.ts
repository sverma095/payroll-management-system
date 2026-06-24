"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function decideReimbursement(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? ""); // approved | rejected
  const approvedAmount = Number(formData.get("approved_amount") ?? 0);

  await supabase
    .from("reimbursements")
    .update({
      status: decision,
      approved_amount: decision === "approved" ? approvedAmount : 0
    })
    .eq("id", id);

  revalidatePath("/reimbursements");
}

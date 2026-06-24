"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function allocateVariablePay(formData: FormData) {
  const supabase = createClient();

  await supabase.from("variable_pay").insert({
    employee_id: String(formData.get("employee_id") ?? ""),
    variable_type: String(formData.get("variable_type") ?? ""),
    allocated_amount: Number(formData.get("allocated_amount") ?? 0),
    approved_amount: 0,
    payout_amount: 0
  });

  revalidatePath("/variable-pay");
}

export async function approveVariablePay(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  const approved_amount = Number(formData.get("approved_amount") ?? 0);

  await supabase.from("variable_pay").update({ approved_amount }).eq("id", id);

  revalidatePath("/variable-pay");
}

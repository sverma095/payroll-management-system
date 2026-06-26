"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addPolicy(formData: FormData) {
  const supabase = createClient();
  await supabase.from("insurance_policies").insert({
    employee_id: String(formData.get("employee_id") ?? ""),
    policy_name: String(formData.get("policy_name") ?? ""),
    policy_number: String(formData.get("policy_number") ?? "") || null,
    sum_insured: Number(formData.get("sum_insured") ?? 0),
    premium: Number(formData.get("premium") ?? 0)
  });
  revalidatePath("/insurance");
}

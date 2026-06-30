"use server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";

export async function createWorkflow(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) return;
  await supabase.from("workflows").insert({
    company_id: companyId,
    workflow_name: String(formData.get("workflow_name") ?? ""),
    module_name: String(formData.get("module_name") ?? ""),
    version: 1,
    active: true
  });
  revalidatePath("/workflows");
}

export async function addStep(formData: FormData) {
  const supabase = createClient();
  await supabase.from("workflow_steps").insert({
    workflow_id: String(formData.get("workflow_id") ?? ""),
    step_no: Number(formData.get("step_no") ?? 1),
    approver_role: String(formData.get("approver_role") ?? "")
  });
  revalidatePath("/workflows");
}

export async function deleteStep(formData: FormData) {
  const supabase = createClient();
  await supabase.from("workflow_steps").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/workflows");
}

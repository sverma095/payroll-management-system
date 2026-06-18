"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createLeaveType(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect(`/leave?error=${encodeURIComponent("Create a company first")}`);
  }

  const { error } = await supabase.from("leave_types").insert({
    company_id: companyId,
    leave_name: String(formData.get("leave_name") ?? ""),
    leave_code: String(formData.get("leave_code") ?? "").toUpperCase(),
    annual_limit: Number(formData.get("annual_limit") ?? 0) || 0,
    carry_forward: formData.get("carry_forward") === "on",
    encashment_allowed: formData.get("encashment_allowed") === "on"
  });

  if (error) {
    redirect(`/leave?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/leave");
}

export async function applyLeave(formData: FormData) {
  const supabase = createClient();

  const from_date = String(formData.get("from_date") ?? "");
  const to_date = String(formData.get("to_date") ?? "");
  if (new Date(to_date) < new Date(from_date)) {
    redirect(`/leave?error=${encodeURIComponent("To date can't be before from date")}`);
  }

  const { error } = await supabase.from("leave_applications").insert({
    employee_id: String(formData.get("employee_id") ?? ""),
    leave_type_id: String(formData.get("leave_type_id") ?? ""),
    from_date,
    to_date,
    status: "pending"
  });

  if (error) {
    redirect(`/leave?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/leave");
}

export async function decideLeave(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? ""); // approved | rejected

  const { error } = await supabase
    .from("leave_applications")
    .update({ status: decision, approved_by: user?.id })
    .eq("id", id);

  if (error) {
    redirect(`/leave?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/leave");
}

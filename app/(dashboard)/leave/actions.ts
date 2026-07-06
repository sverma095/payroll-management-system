"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getActiveWorkflow, startApprovalChain, decideCurrentStep } from "@/lib/workflow";

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
  const { companyId } = await resolveCompanyId(supabase);

  const from_date = String(formData.get("from_date") ?? "");
  const to_date = String(formData.get("to_date") ?? "");
  if (new Date(to_date) < new Date(from_date)) {
    redirect(`/leave?error=${encodeURIComponent("To date can't be before from date")}`);
  }

  const { data: application, error } = await supabase
    .from("leave_applications")
    .insert({
      employee_id: String(formData.get("employee_id") ?? ""),
      leave_type_id: String(formData.get("leave_type_id") ?? ""),
      from_date,
      to_date,
      status: "pending"
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/leave?error=${encodeURIComponent(error.message)}`);
  }

  if (companyId) {
    const workflow = await getActiveWorkflow(supabase, companyId, "leave");
    if (workflow) {
      await startApprovalChain(supabase, "leave", application!.id, workflow);
    }
  }

  revalidatePath("/leave");
}

export async function decideLeave(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? ""); // approved | rejected

  const chainResult = await decideCurrentStep(supabase, "leave", id, decision as "approved" | "rejected", user?.id);
  // chainResult is null when this entity was never put under a workflow
  // (no company workflow existed at submission time) - fall back to
  // deciding it directly, same as before enforcement existed.
  const newStatus = chainResult ?? decision;

  const { error } = await supabase
    .from("leave_applications")
    .update({ status: newStatus, approved_by: user?.id })
    .eq("id", id);

  if (error) {
    redirect(`/leave?error=${encodeURIComponent(error.message)}`);
  }

  if (newStatus !== "pending") {
    const { data: app } = await supabase.from("leave_applications").select("employee_id").eq("id", id).maybeSingle();
    if (app) {
      const { data: appUser } = await supabase.from("app_users").select("id").eq("employee_id", app.employee_id).maybeSingle();
      if (appUser) {
        await supabase.from("notifications").insert({ user_id: appUser.id, title: `Leave ${newStatus}`, body: `Your leave request was ${newStatus}.` });
      }
    }
  }

  revalidatePath("/leave");
}

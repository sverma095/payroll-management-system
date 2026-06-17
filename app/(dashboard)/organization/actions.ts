"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getScopedCompanyId(supabase: ReturnType<typeof createClient>) {
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect("/companies/new?error=" + encodeURIComponent("Create a company first"));
  }
  return companyId!;
}

export async function createBranch(formData: FormData) {
  const supabase = createClient();
  const companyId = await getScopedCompanyId(supabase);

  const { error } = await supabase.from("branches").insert({
    company_id: companyId,
    branch_name: String(formData.get("branch_name") ?? ""),
    state: String(formData.get("state") ?? ""),
    city: String(formData.get("city") ?? ""),
    address: String(formData.get("address") ?? "") || null,
    pt_applicable: formData.get("pt_applicable") === "on",
    lwf_applicable: formData.get("lwf_applicable") === "on"
  });

  if (error) {
    redirect(`/organization?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/organization");
}

export async function createDepartment(formData: FormData) {
  const supabase = createClient();
  const companyId = await getScopedCompanyId(supabase);

  const { error } = await supabase.from("departments").insert({
    company_id: companyId,
    department_name: String(formData.get("department_name") ?? ""),
    department_code: String(formData.get("department_code") ?? "").toUpperCase()
  });

  if (error) {
    redirect(`/organization?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/organization");
}

export async function createDesignation(formData: FormData) {
  const supabase = createClient();
  const companyId = await getScopedCompanyId(supabase);

  const { error } = await supabase.from("designations").insert({
    company_id: companyId,
    designation_name: String(formData.get("designation_name") ?? ""),
    designation_code: String(formData.get("designation_code") ?? "").toUpperCase(),
    grade: String(formData.get("grade") ?? "") || null
  });

  if (error) {
    redirect(`/organization?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/organization");
}

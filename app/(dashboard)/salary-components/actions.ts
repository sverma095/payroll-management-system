"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";

export async function createSalaryComponent(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect(`/salary-components/new?error=${encodeURIComponent("Create a company first")}`);
  }

  const component_type = String(formData.get("component_type") ?? "earning");
  const component_code = String(formData.get("component_code") ?? "").toUpperCase();

  const { data: existing } = await supabase
    .from("salary_components")
    .select("id")
    .eq("company_id", companyId!)
    .eq("component_code", component_code)
    .maybeSingle();

  if (existing) {
    redirect(`/salary-components/new?error=${encodeURIComponent("Component code already exists")}`);
  }

  const { error } = await supabase.from("salary_components").insert({
    company_id: companyId,
    component_name: String(formData.get("component_name") ?? ""),
    component_code,
    component_type,
    earning: component_type === "earning",
    deduction: component_type === "deduction",
    employer_contribution: component_type === "employer_contribution",
    taxable: formData.get("taxable") === "on",
    pf_applicable: formData.get("pf_applicable") === "on",
    esi_applicable: formData.get("esi_applicable") === "on",
    active: true
  });

  if (error) {
    redirect(`/salary-components/new?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/salary-components");
}

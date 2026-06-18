"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseFormula } from "@/lib/formula-engine/parser";

export async function createStructure(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect(`/salary-structure/new?error=${encodeURIComponent("Create a company first")}`);
  }

  const { data: structure, error } = await supabase
    .from("salary_structures")
    .insert({
      company_id: companyId,
      structure_name: String(formData.get("structure_name") ?? ""),
      effective_from: String(formData.get("effective_from") ?? ""),
      effective_to: String(formData.get("effective_to") ?? "") || null,
      status: "active"
    })
    .select()
    .single();

  if (error) {
    redirect(`/salary-structure/new?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/salary-structure/${structure!.id}`);
}

export async function assignSalaryStructure(formData: FormData) {
  const supabase = createClient();
  const employeeId = String(formData.get("employee_id") ?? "");
  const structureId = String(formData.get("structure_id") ?? "");
  const monthlyGross = Number(formData.get("monthly_gross") ?? 0);
  const effectiveFrom = String(formData.get("effective_from") ?? "");

  // close out any prior open-ended assignment for this employee
  await supabase
    .from("employee_salary_assignments")
    .update({ effective_to: effectiveFrom })
    .eq("employee_id", employeeId)
    .is("effective_to", null);

  const { error } = await supabase.from("employee_salary_assignments").insert({
    employee_id: employeeId,
    salary_structure_id: structureId,
    monthly_gross: monthlyGross,
    effective_from: effectiveFrom
  });

  if (error) {
    redirect(`/salary-structure/${structureId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/salary-structure/${structureId}`);
}

export async function addStructureLine(formData: FormData) {
  const structureId = String(formData.get("structure_id") ?? "");
  const formula = String(formData.get("formula") ?? "");

  // Formula Validation (SRS Module 4): catch syntax errors before saving
  try {
    parseFormula(formula);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid formula syntax";
    redirect(`/salary-structure/${structureId}?error=${encodeURIComponent(message)}`);
  }

  const supabase = createClient();
  const { error } = await supabase.from("salary_structure_details").insert({
    salary_structure_id: structureId,
    component_id: String(formData.get("component_id") ?? ""),
    formula,
    sequence: Number(formData.get("sequence") ?? 0),
    effective_from: String(formData.get("effective_from") ?? "")
  });

  if (error) {
    redirect(`/salary-structure/${structureId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/salary-structure/${structureId}`);
}

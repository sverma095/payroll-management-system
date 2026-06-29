"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseFormula } from "@/lib/formula-engine/parser";
import { parseSalaryFile } from "@/lib/payroll/salary-import-parser";

export async function bulkAssignSalary(formData: FormData) {
  const structureId = String(formData.get("structure_id") ?? "");
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect(`/salary-structure/${structureId}?error=${encodeURIComponent("Choose a file first")}`);
  }

  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const buffer = await file!.arrayBuffer();
  const parsed = parseSalaryFile(buffer);

  const { data: emps } = await supabase.from("employees").select("id, employee_code").eq("company_id", companyId ?? "");
  const codeToId = new Map((emps ?? []).map((e) => [e.employee_code.toUpperCase(), e.id]));

  let imported = 0;
  const errors: string[] = [];
  for (const r of parsed) {
    if (r.error) { errors.push(`Row ${r.row}: ${r.error}`); continue; }
    const employeeId = codeToId.get(r.data!.employee_code.toUpperCase());
    if (!employeeId) { errors.push(`Row ${r.row}: unknown employee_code ${r.data!.employee_code}`); continue; }

    await supabase.from("employee_salary_assignments").update({ effective_to: r.data!.effective_from }).eq("employee_id", employeeId).is("effective_to", null);
    await supabase.from("employee_salary_assignments").insert({
      employee_id: employeeId,
      salary_structure_id: structureId,
      monthly_gross: r.data!.monthly_gross,
      effective_from: r.data!.effective_from
    });
    imported++;
  }

  revalidatePath(`/salary-structure/${structureId}`);
  redirect(`/salary-structure/${structureId}?imported=${imported}&skipped=${errors.length}&errors=${encodeURIComponent(errors.slice(0, 5).join(" | "))}`);
}

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

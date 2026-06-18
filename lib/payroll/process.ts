import { SupabaseClient } from "@supabase/supabase-js";
import { computeStructure, ComponentFormula } from "@/lib/formula-engine";
import { fetchMonthlyAttendanceSummary } from "@/lib/attendance/summary";
import { getWorkingDaysInMonth } from "@/lib/attendance/working-days";
import { estimateMonthlyTDS } from "./tds-estimator";

export interface PayrollIssue {
  employeeId: string;
  employeeCode: string;
  message: string;
}

export interface PayrollRunResult {
  ok: boolean;
  issues: PayrollIssue[];
  processedCount: number;
  headerId: string | null;
}

interface EmployeeRow {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  pan: string | null;
  uan: string | null;
}

/**
 * SRS Module 6 validation rules: Missing PAN, Missing Bank, Missing UAN
 * (warning only — not every employee is PF-covered), Duplicate UAN.
 * Missing PAN/Bank block the run; everything else is a warning.
 */
function validateEmployees(
  employees: EmployeeRow[],
  bankByEmployee: Map<string, boolean>,
  assignmentByEmployee: Map<string, unknown>
): { blocking: PayrollIssue[]; warnings: PayrollIssue[] } {
  const blocking: PayrollIssue[] = [];
  const warnings: PayrollIssue[] = [];

  const uanCounts = new Map<string, number>();
  for (const e of employees) {
    if (e.uan) uanCounts.set(e.uan, (uanCounts.get(e.uan) ?? 0) + 1);
  }

  for (const e of employees) {
    const tag = (message: string) => ({ employeeId: e.id, employeeCode: e.employee_code, message });

    if (!e.pan) blocking.push(tag("Missing PAN"));
    if (!bankByEmployee.get(e.id)) blocking.push(tag("Missing bank account"));
    if (!assignmentByEmployee.has(e.id)) blocking.push(tag("No salary structure assigned"));
    if (!e.uan) warnings.push(tag("Missing UAN"));
    if (e.uan && (uanCounts.get(e.uan) ?? 0) > 1) blocking.push(tag(`Duplicate UAN: ${e.uan}`));
  }

  return { blocking, warnings };
}

export async function runPayroll(
  supabase: SupabaseClient,
  companyId: string,
  year: number,
  month: number,
  processedBy: string | null
): Promise<PayrollRunResult> {
  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name, pan, uan")
    .eq("company_id", companyId)
    .eq("status", "active");

  if (!employees || employees.length === 0) {
    return { ok: false, issues: [{ employeeId: "", employeeCode: "", message: "No active employees" }], processedCount: 0, headerId: null };
  }

  const employeeIds = employees.map((e) => e.id);

  const { data: banks } = await supabase
    .from("employee_banks")
    .select("employee_id, account_number, ifsc")
    .in("employee_id", employeeIds)
    .eq("is_primary", true);
  const bankByEmployee = new Map(banks?.map((b) => [b.employee_id, !!(b.account_number && b.ifsc)]) ?? []);

  const periodEnd = new Date(year, month, 0).toISOString().slice(0, 10);

  const { data: assignments } = await supabase
    .from("employee_salary_assignments")
    .select("employee_id, salary_structure_id, monthly_gross, effective_from, effective_to")
    .in("employee_id", employeeIds)
    .lte("effective_from", periodEnd)
    .or(`effective_to.is.null,effective_to.gte.${periodEnd}`);

  const assignmentByEmployee = new Map(assignments?.map((a) => [a.employee_id, a]) ?? []);

  const { blocking, warnings } = validateEmployees(employees, bankByEmployee, assignmentByEmployee);
  if (blocking.length > 0) {
    return { ok: false, issues: [...blocking, ...warnings], processedCount: 0, headerId: null };
  }

  const structureIds = Array.from(new Set(Array.from(assignmentByEmployee.values()).map((a: any) => a.salary_structure_id)));
  const { data: allDetails } = await supabase
    .from("salary_structure_details")
    .select("salary_structure_id, formula, salary_components(component_code, component_name, component_type)")
    .in("salary_structure_id", structureIds);

  const detailsByStructure = new Map<string, { code: string; name: string; formula: string; type: string }[]>();
  for (const d of (allDetails ?? []) as any[]) {
    if (!d.salary_components?.component_code) continue;
    const list = detailsByStructure.get(d.salary_structure_id) ?? [];
    list.push({
      code: d.salary_components.component_code,
      name: d.salary_components.component_name,
      formula: d.formula,
      type: d.salary_components.component_type
    });
    detailsByStructure.set(d.salary_structure_id, list);
  }

  const attendanceSummary = await fetchMonthlyAttendanceSummary(supabase, companyId, year, month);
  const attendanceByEmployee = new Map(attendanceSummary.map((s) => [s.employeeId, s]));
  const workingDays = getWorkingDaysInMonth(year, month);

  const { data: header, error: headerError } = await supabase
    .from("payroll_headers")
    .upsert(
      { company_id: companyId, month, year, status: "processed", processed_by: processedBy, processed_on: new Date().toISOString() },
      { onConflict: "company_id,month,year" }
    )
    .select()
    .single();

  if (headerError || !header) {
    return { ok: false, issues: [{ employeeId: "", employeeCode: "", message: headerError?.message ?? "Could not create payroll header" }], processedCount: 0, headerId: null };
  }

  const detailRows: Record<string, unknown>[] = [];

  for (const e of employees) {
    const assignment = assignmentByEmployee.get(e.id) as any;
    const components: { code: string; name: string; formula: string; type: string }[] = detailsByStructure.get(assignment.salary_structure_id) ?? [];
    const attendance = attendanceByEmployee.get(e.id);
    const payableDays = attendance?.payableDays ?? workingDays;
    const proratedGross = Math.round((Number(assignment.monthly_gross) * payableDays) / workingDays);

    const { values } = computeStructure(
      components.map(({ code, formula }) => ({ code, formula })),
      { GROSS: proratedGross }
    );

    const byCode = (code: string) => values[code.toUpperCase()] ?? 0;
    const hasComponent = (code: string) => components.some((c) => c.code.toUpperCase() === code);

    const totalEarnings = components
      .filter((c) => c.type === "earning")
      .reduce((sum, c) => sum + byCode(c.code), 0);

    const pf = byCode("PF");
    const esi = byCode("ESI");
    const pt = byCode("PT");
    const lwf = byCode("LWF");
    const tds = hasComponent("TDS") ? byCode("TDS") : estimateMonthlyTDS(proratedGross * 12);

    const otherDeductions = components
      .filter((c) => c.type === "deduction" && !["PF", "ESI", "PT", "LWF", "TDS"].includes(c.code.toUpperCase()))
      .reduce((sum, c) => sum + byCode(c.code), 0);

    const totalDeduction = pf + esi + pt + lwf + tds + otherDeductions;
    const netSalary = totalEarnings - totalDeduction;

    detailRows.push({
      payroll_header_id: header.id,
      employee_id: e.id,
      gross_salary: totalEarnings,
      total_deduction: totalDeduction,
      net_salary: netSalary,
      pf,
      esi,
      pt,
      lwf,
      tds,
      breakdown_json: {
        components: components.map((c) => ({ code: c.code, name: c.name, type: c.type, value: byCode(c.code) })),
        payableDays,
        workingDays,
        proratedGross,
        tdsEstimated: !hasComponent("TDS")
      }
    });
  }

  const negativeNet = detailRows.filter((r: any) => r.net_salary < 0);
  if (negativeNet.length > 0) {
    return {
      ok: false,
      issues: negativeNet.map((r: any) => ({ employeeId: r.employee_id, employeeCode: "", message: "Negative net salary" })),
      processedCount: 0,
      headerId: header.id
    };
  }

  const { error: detailError } = await supabase
    .from("payroll_details")
    .upsert(detailRows, { onConflict: "payroll_header_id,employee_id" });

  if (detailError) {
    return { ok: false, issues: [{ employeeId: "", employeeCode: "", message: detailError.message }], processedCount: 0, headerId: header.id };
  }

  return { ok: true, issues: warnings, processedCount: detailRows.length, headerId: header.id };
}

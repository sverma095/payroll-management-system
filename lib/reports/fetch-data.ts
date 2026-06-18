import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchReportData(supabase: SupabaseClient, companyId: string, year: number, month: number) {
  const { data: header } = await supabase
    .from("payroll_headers")
    .select("id, status")
    .eq("company_id", companyId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  const { data: details } = header
    ? await supabase
        .from("payroll_details")
        .select("employee_id, gross_salary, total_deduction, net_salary, pf, esi, pt, lwf, tds, breakdown_json")
        .eq("payroll_header_id", header.id)
    : { data: [] };

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name, uan, esic_number, pan, status, departments(department_name), designations(designation_name)")
    .eq("company_id", companyId);

  const employeesFlat = (employees ?? []).map((e: any) => ({
    ...e,
    department_name: e.departments?.department_name ?? null,
    designation_name: e.designations?.designation_name ?? null
  }));

  const employeesMap = new Map(employeesFlat.map((e) => [e.id, e]));

  return {
    header,
    details: details ?? [],
    employeesList: employeesFlat,
    employeesMap
  };
}

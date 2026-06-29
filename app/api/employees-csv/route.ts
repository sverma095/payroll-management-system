import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const { data } = companyId
    ? await supabase.from("employees").select("employee_code, first_name, last_name, doj, pan, uan, status, departments(department_name), designations(designation_name)").eq("company_id", companyId)
    : { data: [] };

  const lines = ["employee_code,first_name,last_name,doj,pan,uan,status,department,designation"];
  for (const e of (data ?? []) as any[]) {
    lines.push([e.employee_code, e.first_name, e.last_name ?? "", e.doj, e.pan ?? "", e.uan ?? "", e.status, e.departments?.department_name ?? "", e.designations?.designation_name ?? ""].join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="employees.csv"` }
  });
}

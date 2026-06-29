import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("employee_salary_assignments")
    .select("monthly_gross, effective_from, employees(employee_code, first_name, last_name)")
    .eq("salary_structure_id", params.id)
    .is("effective_to", null);

  const lines = ["employee_code,name,monthly_gross,effective_from"];
  for (const a of (data ?? []) as any[]) {
    lines.push(`${a.employees?.employee_code},"${a.employees?.first_name} ${a.employees?.last_name ?? ""}",${a.monthly_gross},${a.effective_from}`);
  }

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="assignments-${params.id}.csv"` }
  });
}

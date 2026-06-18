import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { fetchReportData } from "@/lib/reports/fetch-data";
import {
  buildPayrollRegister,
  buildPFReport,
  buildESIReport,
  buildPTReport,
  buildLWFReport,
  buildTDSReport,
  buildHeadcountReport,
  ReportTable
} from "@/lib/reports/builders";
import { tableToCsv } from "@/lib/reports/to-csv";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const report = request.nextUrl.searchParams.get("report") ?? "register";
  const period = request.nextUrl.searchParams.get("period") ?? "";
  const [year, month] = period.split("-").map(Number);

  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  let table: ReportTable;

  if (report === "headcount") {
    const { employeesList } = await fetchReportData(supabase, companyId, year || 2026, month || 1);
    table = buildHeadcountReport(employeesList.filter((e: any) => e.status === "active") as any);
  } else {
    const { details, employeesMap } = await fetchReportData(supabase, companyId, year, month);
    const builders: Record<string, () => ReportTable> = {
      register: () => buildPayrollRegister(details as any, employeesMap as any),
      pf: () => buildPFReport(details as any, employeesMap as any),
      esi: () => buildESIReport(details as any, employeesMap as any),
      pt: () => buildPTReport(details as any, employeesMap as any),
      lwf: () => buildLWFReport(details as any, employeesMap as any),
      tds: () => buildTDSReport(details as any, employeesMap as any)
    };
    table = (builders[report] ?? builders.register)();
  }

  const csv = tableToCsv(table);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${report}-${period || "report"}.csv"`
    }
  });
}

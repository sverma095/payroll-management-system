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
import { buildJournalVoucher } from "@/lib/reports/journal-voucher";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

const REPORT_TABS = [
  { key: "register", label: "Payroll Register" },
  { key: "pf", label: "PF" },
  { key: "esi", label: "ESI" },
  { key: "pt", label: "PT" },
  { key: "lwf", label: "LWF" },
  { key: "tds", label: "TDS" },
  { key: "jv", label: "Accounting (JV)" },
  { key: "headcount", label: "Headcount" },
  { key: "audit", label: "Audit log" }
];

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function tabNeedsPeriod(key: string) {
  return key !== "headcount" && key !== "audit";
}

export default async function ReportsPage({
  searchParams
}: {
  searchParams: { period?: string; report?: string };
}) {
  const period = searchParams?.period || currentPeriod();
  const report = searchParams?.report || "register";
  const [year, month] = period.split("-").map(Number);

  const supabase = createClient();
  const { companyId, tenantId } = await resolveCompanyId(supabase);

  let table: ReportTable | null = null;
  let auditRows: any[] = [];

  if (companyId && report !== "audit") {
    const { details, employeesList, employeesMap } = await fetchReportData(supabase, companyId, year, month);

    switch (report) {
      case "pf":
        table = buildPFReport(details as any, employeesMap as any);
        break;
      case "esi":
        table = buildESIReport(details as any, employeesMap as any);
        break;
      case "pt":
        table = buildPTReport(details as any, employeesMap as any);
        break;
      case "lwf":
        table = buildLWFReport(details as any, employeesMap as any);
        break;
      case "tds":
        table = buildTDSReport(details as any, employeesMap as any);
        break;
      case "jv":
        table = buildJournalVoucher(details as any);
        break;
      case "headcount":
        table = buildHeadcountReport(employeesList.filter((e: any) => e.status === "active") as any);
        break;
      default:
        table = buildPayrollRegister(details as any, employeesMap as any);
    }
  }

  if (report === "audit" && tenantId) {
    const { data } = await supabase
      .from("audit_logs")
      .select("created_at, module_name, action, user_id")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50);
    auditRows = data ?? [];
  }

  const needsPeriod = tabNeedsPeriod(report);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Reports</h1>
      <p className="text-sm text-ink/50 mb-6">
        Built from whatever payroll has already processed for the selected period.
      </p>

      <div className="flex items-center gap-1 mb-4 border-b border-line">
        {REPORT_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/reports?report=${tab.key}${tabNeedsPeriod(tab.key) ? `&period=${period}` : ""}`}
            className={`px-3 py-2 text-sm -mb-px border-b-2 ${
              report === tab.key ? "border-accent text-accent font-medium" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {needsPeriod && (
        <form method="get" className="mb-4 flex items-center gap-2">
          <input type="hidden" name="report" value={report} />
          <input
            type="month"
            name="period"
            defaultValue={period}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
          <button type="submit" className="rounded-lg border border-line bg-white text-sm px-3 py-2 hover:bg-accentSoft transition-colors">
            Go
          </button>
          {table && table.rows.length > 0 && (
            <a
              href={`/api/reports?report=${report}&period=${period}`}
              className="ml-auto rounded-lg border border-line bg-white text-sm px-3 py-2 hover:bg-accentSoft transition-colors"
            >
              Download CSV
            </a>
          )}
        </form>
      )}

      {report === "audit" ? (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Module</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.length > 0 ? (
                auditRows.map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink/70 font-mono text-xs">{new Date(r.created_at).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-ink">{r.module_name}</td>
                    <td className="px-4 py-2.5 text-ink/70">{r.action}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-0 py-2"><EmptyState message="No activity yet." /></td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          {table?.note && (
            <p className="px-4 py-2 text-xs text-warn bg-warn/5 border-b border-line">{table.note}</p>
          )}
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                {table?.columns.map((c) => (
                  <th key={c.key} className="px-4 py-2.5 font-medium">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table && table.rows.length > 0 ? (
                table.rows.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {table!.columns.map((c) => (
                      <td key={c.key} className="px-4 py-2.5 text-ink/70">
                        {typeof row[c.key] === "number" ? Number(row[c.key]).toLocaleString("en-IN") : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={table?.columns.length ?? 1} className="px-0 py-2"><EmptyState message="No data for this period." /></td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

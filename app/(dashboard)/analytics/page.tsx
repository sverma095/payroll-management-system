import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { EmptyState } from "@/components/empty-state";

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: employees } = companyId
    ? await supabase.from("employees").select("status, doj").eq("company_id", companyId)
    : { data: [] };

  const { data: headers } = companyId
    ? await supabase.from("payroll_headers").select("id, month, year").eq("company_id", companyId).order("year").order("month")
    : { data: [] };

  const headerIds = (headers ?? []).map((h) => h.id);
  const { data: details } = headerIds.length
    ? await supabase.from("payroll_details").select("payroll_header_id, net_salary, gross_salary").in("payroll_header_id", headerIds)
    : { data: [] };

  const active = (employees ?? []).filter((e) => e.status === "active").length;
  const relieved = (employees ?? []).filter((e) => e.status === "relieved" || e.status === "ff_completed").length;
  const attritionRate = active + relieved > 0 ? Math.round((relieved / (active + relieved)) * 1000) / 10 : 0;

  const activeEmps = (employees ?? []).filter((e) => e.status === "active" && e.doj);
  const avgTenureYears = activeEmps.length
    ? Math.round((activeEmps.reduce((s, e) => s + (Date.now() - new Date(e.doj).getTime()) / 86400000, 0) / activeEmps.length / 365) * 10) / 10
    : 0;

  const costByPeriod = (headers ?? []).map((h) => ({
    label: `${h.month}/${h.year}`,
    cost: (details ?? []).filter((d) => d.payroll_header_id === h.id).reduce((s, r) => s + Number(r.gross_salary ?? 0), 0)
  }));

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Analytics</h1>
      <p className="text-sm text-ink/50 mb-6">Rule-based workforce &amp; payroll insights (not a trained ML model).</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-line rounded-xl p-4"><p className="text-xs text-ink/50">Active employees</p><p className="text-lg font-semibold text-ink">{active}</p></div>
        <div className="bg-white border border-line rounded-xl p-4"><p className="text-xs text-ink/50">Attrition rate</p><p className="text-lg font-semibold text-ink">{attritionRate}%</p></div>
        <div className="bg-white border border-line rounded-xl p-4"><p className="text-xs text-ink/50">Avg tenure</p><p className="text-lg font-semibold text-ink">{avgTenureYears} yrs</p></div>
        <div className="bg-white border border-line rounded-xl p-4"><p className="text-xs text-ink/50">Payroll runs tracked</p><p className="text-lg font-semibold text-ink">{headers?.length ?? 0}</p></div>
      </div>
      <div className="bg-white border border-line rounded-xl overflow-hidden max-w-md">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-ink/50"><th className="px-4 py-2.5 font-medium">Period</th><th className="px-4 py-2.5 font-medium text-right">Gross cost</th></tr></thead>
          <tbody>
            {costByPeriod.length > 0 ? costByPeriod.map((c) => (
              <tr key={c.label} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink/70">{c.label}</td>
                <td className="px-4 py-2.5 text-right font-mono">{c.cost.toLocaleString("en-IN")}</td>
              </tr>
            )) : <tr><td colSpan={2} className="px-0 py-2"><EmptyState message="No payroll history yet." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";

export default async function ComplianceDashboardPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const now = new Date();
  const { data: header } = companyId
    ? await supabase.from("payroll_headers").select("id").eq("company_id", companyId).eq("year", now.getFullYear()).eq("month", now.getMonth() + 1).maybeSingle()
    : { data: null };

  const { data: totals } = header
    ? await supabase.from("payroll_details").select("pf, esi, pt, lwf, tds, net_salary").eq("payroll_header_id", header.id)
    : { data: [] };

  const sum = (k: string) => (totals ?? []).reduce((s: number, r: any) => s + Number(r[k] ?? 0), 0);

  const [{ count: pendingLeave }, { count: pendingClaims }, { count: activeLoans }] = await Promise.all([
    companyId
      ? supabase
          .from("leave_applications")
          .select("id, employees!inner(company_id)", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("employees.company_id", companyId)
      : Promise.resolve({ count: 0 }),
    companyId
      ? supabase
          .from("reimbursements")
          .select("id, employees!inner(company_id)", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("employees.company_id", companyId)
      : Promise.resolve({ count: 0 }),
    companyId
      ? supabase
          .from("loans")
          .select("id, employees!inner(company_id)", { count: "exact", head: true })
          .eq("status", "active")
          .eq("employees.company_id", companyId)
      : Promise.resolve({ count: 0 })
  ]);

  const cards = [
    { label: "PF (this month)", value: sum("pf") },
    { label: "ESI", value: sum("esi") },
    { label: "PT", value: sum("pt") },
    { label: "LWF", value: sum("lwf") },
    { label: "TDS", value: sum("tds") }
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Compliance Dashboard</h1>
      <p className="text-sm text-ink/50 mb-6">Current month statutory totals + pending approvals.</p>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-line rounded-xl p-4">
            <p className="text-xs text-ink/50">{c.label}</p>
            <p className="text-lg font-mono font-semibold text-ink">₹{c.value.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-xs text-ink/50">Pending leave approvals</p>
          <p className="text-lg font-semibold text-ink">{pendingLeave ?? 0}</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-xs text-ink/50">Pending reimbursement claims</p>
          <p className="text-lg font-semibold text-ink">{pendingClaims ?? 0}</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-xs text-ink/50">Active loans</p>
          <p className="text-lg font-semibold text-ink">{activeLoans ?? 0}</p>
        </div>
      </div>
    </div>
  );
}

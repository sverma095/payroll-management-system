import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import Link from "next/link";
import { Users, IndianRupee, Clock, AlertTriangle, FileText, ArrowRight, UserPlus, PlayCircle, FileBarChart, CalendarPlus } from "lucide-react";
import { TrendChart } from "@/components/trend-chart";

export default async function DashboardPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const now = new Date();
  const [
    { count: activeEmployees },
    { count: pendingLeave },
    { count: pendingClaims },
    { count: pendingTickets },
    { data: currentHeader }
  ] = await Promise.all([
    companyId ? supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active") : Promise.resolve({ count: 0 }),
    companyId
      ? supabase.from("leave_applications").select("id, employees!inner(company_id)", { count: "exact", head: true }).eq("status", "pending").eq("employees.company_id", companyId)
      : Promise.resolve({ count: 0 }),
    companyId
      ? supabase.from("reimbursements").select("id, employees!inner(company_id)", { count: "exact", head: true }).eq("status", "pending").eq("employees.company_id", companyId)
      : Promise.resolve({ count: 0 }),
    companyId
      ? supabase.from("helpdesk_tickets").select("id, employees!inner(company_id)", { count: "exact", head: true }).eq("status", "open").eq("employees.company_id", companyId)
      : Promise.resolve({ count: 0 }),
    companyId
      ? supabase.from("payroll_headers").select("id, status").eq("company_id", companyId).eq("year", now.getFullYear()).eq("month", now.getMonth() + 1).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const { tenantId } = await resolveCompanyId(supabase);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: expiringDocs }, { data: recentActivity }] = await Promise.all([
    companyId
      ? supabase
          .from("documents")
          .select("id, doc_name, expiry_date")
          .eq("company_id", companyId)
          .not("expiry_date", "is", null)
          .lte("expiry_date", in30Days)
          .order("expiry_date")
          .limit(5)
      : Promise.resolve({ data: [] as any[] }),
    tenantId
      ? supabase
          .from("audit_logs")
          .select("action, module_name, created_at, new_value_json")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] as any[] })
  ]);

  const ACTION_LABELS: Record<string, string> = {
    create_company: "Company created",
    update_company: "Company details updated",
    create_employee: "Employee added",
    update_employee: "Employee details updated",
    process_payroll: "Payroll processed",
    payroll_approved: "Payroll approved",
    payroll_locked: "Payroll locked",
    issue_loan: "Loan issued",
    initiate_fnf: "Full & final settlement initiated"
  };

  const { data: netTotal } = currentHeader
    ? await supabase.from("payroll_details").select("net_salary").eq("payroll_header_id", currentHeader.id)
    : { data: [] };
  const currentMonthCost = (netTotal ?? []).reduce((s, r: any) => s + Number(r.net_salary ?? 0), 0);

  // Last 6 calendar months (oldest -> newest, ending this month), each
  // mapped to its net payroll cost if that month was ever run.
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString("en-IN", { month: "short" }) };
  });

  const { data: recentHeaders } = companyId
    ? await supabase
        .from("payroll_headers")
        .select("id, year, month")
        .eq("company_id", companyId)
        .or(months.map((m) => `and(year.eq.${m.year},month.eq.${m.month})`).join(","))
    : { data: [] };

  const headerIds = (recentHeaders ?? []).map((h: any) => h.id);
  const { data: recentDetails } = headerIds.length
    ? await supabase.from("payroll_details").select("payroll_header_id, net_salary").in("payroll_header_id", headerIds)
    : { data: [] };

  const costByHeader = new Map<string, number>();
  (recentDetails ?? []).forEach((r: any) => {
    costByHeader.set(r.payroll_header_id, (costByHeader.get(r.payroll_header_id) ?? 0) + Number(r.net_salary ?? 0));
  });
  const costByMonth = new Map<string, number>();
  (recentHeaders ?? []).forEach((h: any) => {
    costByMonth.set(`${h.year}-${h.month}`, costByHeader.get(h.id) ?? 0);
  });

  const trendPoints = months.map((m) => ({
    label: m.label,
    value: costByMonth.get(`${m.year}-${m.month}`) ?? 0
  }));

  const cards = [
    { label: "Active employees", value: activeEmployees ?? 0, icon: Users, href: "/employees", tile: "tileBlue" },
    { label: "This month's net payroll", value: `₹${currentMonthCost.toLocaleString("en-IN")}`, icon: IndianRupee, href: "/payroll", tile: "tileAmber" },
    { label: "Payroll status", value: currentHeader?.status ?? "Not run", icon: Clock, href: "/payroll", capitalize: true, tile: "tileViolet" },
    { label: "Pending approvals", value: (pendingLeave ?? 0) + (pendingClaims ?? 0), icon: AlertTriangle, href: "/leave", tile: "tileRose" }
  ];

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const quickActions = [
    { label: "Add employee", href: "/employees/new", icon: UserPlus, tile: "tileBlue" },
    { label: "Process payroll", href: "/payroll", icon: PlayCircle, tile: "tileAmber" },
    { label: "Apply leave", href: "/leave", icon: CalendarPlus, tile: "tileViolet" },
    { label: "View reports", href: "/reports", icon: FileBarChart, tile: "tileRose" }
  ];

  const TILE_CLASSES: Record<string, { bg: string; text: string }> = {
    tileBlue: { bg: "bg-tileBlue-soft", text: "text-tileBlue-text" },
    tileAmber: { bg: "bg-tileAmber-soft", text: "text-tileAmber-text" },
    tileViolet: { bg: "bg-tileViolet-soft", text: "text-tileViolet-text" },
    tileRose: { bg: "bg-tileRose-soft", text: "text-tileRose-text" }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">{greeting},</h1>
      <p className="text-sm text-ink/50 mb-6">Here's the overview for this month's payroll and pending work.</p>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {quickActions.map((a) => {
          const Icon = a.icon;
          const tile = TILE_CLASSES[a.tile];
          return (
            <Link
              key={a.label}
              href={a.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 ${tile.bg} hover:shadow-lifted transition-shadow`}
            >
              <span className={`inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white/70 ${tile.text}`}>
                <Icon size={17} />
              </span>
              <span className={`text-sm font-medium ${tile.text}`}>{a.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          const tile = TILE_CLASSES[c.tile];
          return (
            <Link key={c.label} href={c.href} className="bg-white border border-line rounded-xl p-4 hover:border-accent/40 hover:shadow-lifted transition-all group shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${tile.bg} ${tile.text}`}>
                  <Icon size={14} />
                </span>
                <ArrowRight size={14} className="text-ink/0 group-hover:text-ink/40 transition-colors" />
              </div>
              <p className="text-xs text-ink/50">{c.label}</p>
              <p className={`text-lg font-semibold text-ink ${c.capitalize ? "capitalize" : ""}`}>{c.value}</p>
            </Link>
          );
        })}
      </div>

      {companyId && (
        <div className="bg-white border border-line rounded-xl p-5 mb-8 shadow-card">
          <p className="text-sm text-ink mb-1">Payroll cost trend</p>
          <p className="text-xs text-ink/50 mb-4">Net payroll, last 6 months</p>
          <TrendChart points={trendPoints} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl shadow-card">
          <p className="text-sm font-semibold text-ink px-5 pt-4 pb-1">My Tasks</p>
          <div className="divide-y divide-line">
            <Link href="/leave" className="flex items-center justify-between px-5 py-3 hover:bg-paper/60 transition-colors">
              <div>
                <p className="text-sm text-ink">Pending leave</p>
                <p className="text-xs text-ink/50">{pendingLeave ?? 0} request(s) awaiting decision</p>
              </div>
              <ArrowRight size={15} className="text-ink/30" />
            </Link>
            <Link href="/reimbursements" className="flex items-center justify-between px-5 py-3 hover:bg-paper/60 transition-colors">
              <div>
                <p className="text-sm text-ink">Pending claims</p>
                <p className="text-xs text-ink/50">{pendingClaims ?? 0} reimbursement claim(s)</p>
              </div>
              <ArrowRight size={15} className="text-ink/30" />
            </Link>
            <Link href="/helpdesk" className="flex items-center justify-between px-5 py-3 hover:bg-paper/60 transition-colors">
              <div>
                <p className="text-sm text-ink">Open tickets</p>
                <p className="text-xs text-ink/50">{pendingTickets ?? 0} helpdesk ticket(s)</p>
              </div>
              <ArrowRight size={15} className="text-ink/30" />
            </Link>
            {(expiringDocs ?? []).map((d: any) => (
              <Link key={d.id} href="/documents" className="flex items-center justify-between px-5 py-3 hover:bg-paper/60 transition-colors">
                <div>
                  <p className="text-sm text-ink">{d.doc_name}</p>
                  <p className="text-xs text-caution-text">Expires {new Date(d.expiry_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
                <ArrowRight size={15} className="text-ink/30" />
              </Link>
            ))}
            {!pendingLeave && !pendingClaims && !pendingTickets && (expiringDocs ?? []).length === 0 && (
              <p className="px-5 py-6 text-sm text-ink/40 text-center">Hurrah! Your task list is empty.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl shadow-card">
          <p className="text-sm font-semibold text-ink px-5 pt-4 pb-1">Latest Updates</p>
          <div className="divide-y divide-line">
            {(recentActivity ?? []).length === 0 && (
              <p className="px-5 py-6 text-sm text-ink/40 text-center">No activity yet.</p>
            )}
            {(recentActivity ?? []).map((a: any, idx: number) => (
              <div key={idx} className="px-5 py-3">
                <p className="text-xs text-ink/40">{new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                <p className="text-sm text-ink">{a.new_value_json?.description ?? ACTION_LABELS[a.action] ?? a.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!currentHeader && companyId && (
        <div className="mt-6 bg-accentSoft border border-accent/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-accent" />
            <p className="text-sm text-ink">Payroll for {now.toLocaleString("en-IN", { month: "long" })} hasn't been run yet.</p>
          </div>
          <Link href="/payroll" className="text-sm text-accent font-medium hover:underline">Run payroll →</Link>
        </div>
      )}
    </div>
  );
}

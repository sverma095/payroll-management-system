import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import Link from "next/link";
import { Users, IndianRupee, Clock, AlertTriangle, FileText, ArrowRight } from "lucide-react";

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
    supabase.from("leave_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reimbursements").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("helpdesk_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    companyId
      ? supabase.from("payroll_headers").select("id, status").eq("company_id", companyId).eq("year", now.getFullYear()).eq("month", now.getMonth() + 1).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const { data: netTotal } = currentHeader
    ? await supabase.from("payroll_details").select("net_salary").eq("payroll_header_id", currentHeader.id)
    : { data: [] };
  const currentMonthCost = (netTotal ?? []).reduce((s, r: any) => s + Number(r.net_salary ?? 0), 0);

  const cards = [
    { label: "Active employees", value: activeEmployees ?? 0, icon: Users, href: "/employees" },
    { label: "This month's net payroll", value: `₹${currentMonthCost.toLocaleString("en-IN")}`, icon: IndianRupee, href: "/payroll" },
    { label: "Payroll status", value: currentHeader?.status ?? "Not run", icon: Clock, href: "/payroll", capitalize: true },
    { label: "Pending approvals", value: (pendingLeave ?? 0) + (pendingClaims ?? 0), icon: AlertTriangle, href: "/leave" }
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Dashboard</h1>
      <p className="text-sm text-ink/50 mb-6">Overview of this month's payroll and pending work.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className="bg-white border border-line rounded-xl p-4 hover:border-accent/40 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <Icon size={16} className="text-accent" />
                <ArrowRight size={14} className="text-ink/0 group-hover:text-ink/40 transition-colors" />
              </div>
              <p className="text-xs text-ink/50">{c.label}</p>
              <p className={`text-lg font-semibold text-ink ${c.capitalize ? "capitalize" : ""}`}>{c.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/leave" className="bg-white border border-line rounded-xl p-4 flex items-center justify-between hover:border-accent/40 transition-colors">
          <div>
            <p className="text-sm text-ink">Pending leave</p>
            <p className="text-xs text-ink/50">{pendingLeave ?? 0} request(s) awaiting decision</p>
          </div>
          <ArrowRight size={16} className="text-ink/30" />
        </Link>
        <Link href="/reimbursements" className="bg-white border border-line rounded-xl p-4 flex items-center justify-between hover:border-accent/40 transition-colors">
          <div>
            <p className="text-sm text-ink">Pending claims</p>
            <p className="text-xs text-ink/50">{pendingClaims ?? 0} reimbursement claim(s)</p>
          </div>
          <ArrowRight size={16} className="text-ink/30" />
        </Link>
        <Link href="/helpdesk" className="bg-white border border-line rounded-xl p-4 flex items-center justify-between hover:border-accent/40 transition-colors">
          <div>
            <p className="text-sm text-ink">Open tickets</p>
            <p className="text-xs text-ink/50">{pendingTickets ?? 0} helpdesk ticket(s)</p>
          </div>
          <ArrowRight size={16} className="text-ink/30" />
        </Link>
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

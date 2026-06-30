import { NotificationBell } from "@/components/notification-bell";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Companies" },
  { href: "/organization", label: "Organization" },
  { href: "/employees", label: "Employees" },
  { href: "/org-chart", label: "Org Chart" },
  { href: "/salary-history", label: "Salary History" },
  { href: "/salary-components", label: "Salary components" },
  { href: "/salary-structure", label: "Salary structure" },
  { href: "/attendance", label: "Attendance" },
  { href: "/leave", label: "Leave" },
  { href: "/payroll", label: "Payroll processing" },
  { href: "/payslips", label: "Payslips" },
  { href: "/loans", label: "Loans" },
  { href: "/reimbursements", label: "Reimbursements" },
  { href: "/variable-pay", label: "Variable Pay" },
  { href: "/performance", label: "Performance" },
  { href: "/full-and-final", label: "Full & Final" },
  { href: "/bonus", label: "Bonus" },
  { href: "/compliance-dashboard", label: "Compliance" },
  { href: "/insurance", label: "Insurance" },
  { href: "/billing", label: "Billing" },
  { href: "/analytics", label: "Analytics" },
  { href: "/documents", label: "Documents" },
  { href: "/helpdesk", label: "Helpdesk" },
  { href: "/workflows", label: "Workflows" },
  { href: "/compliance-calendar", label: "Compliance Calendar" },
  { href: "/holidays", label: "Holidays" },
  { href: "/tax-declarations", label: "Tax Declarations" },
  { href: "/pt-slabs", label: "PT Slabs" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" }
];

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { employeeId, companyId } = await resolveCompanyId(supabase);

  if (employeeId) {
    redirect("/ess/profile");
  }

  const { data: company } = companyId
    ? await supabase.from("companies").select("theme_color, logo_url").eq("id", companyId).maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen flex" style={{ "--accent-color": company?.theme_color || "#2F5D50" } as React.CSSProperties}>
      <aside className="w-60 border-r border-line bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-sm font-mono tracking-wider text-ink/60 uppercase">
              Payroll OS
            </span>
          </div>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-5 py-2 text-sm text-ink/70 hover:bg-accentSoft hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-line text-xs text-ink/40 truncate">
          <NotificationBell />
          {user?.email}
        </div>
      </aside>
      <main className="flex-1 bg-paper">{children}</main>
    </div>
  );
}

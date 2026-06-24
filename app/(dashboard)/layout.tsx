import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Companies" },
  { href: "/organization", label: "Organization" },
  { href: "/employees", label: "Employees" },
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
  const { employeeId } = await resolveCompanyId(supabase);

  if (employeeId) {
    redirect("/ess/profile");
  }

  return (
    <div className="min-h-screen flex">
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
          {user?.email}
        </div>
      </aside>
      <main className="flex-1 bg-paper">{children}</main>
    </div>
  );
}

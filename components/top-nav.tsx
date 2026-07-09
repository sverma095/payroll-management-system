"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_GROUPS } from "@/lib/nav-data";
import { Menu, X, ChevronDown, Grid3x3, LayoutDashboard, Users, PlayCircle, CalendarDays, FileBarChart, Workflow, ListChecks } from "lucide-react";
import { CommandPalette } from "@/components/command-palette";

import { setPayrollMonthCookie } from "@/app/(dashboard)/payroll-month-actions";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const APPS = [
  { href: "/dashboard", label: "Homepage", icon: LayoutDashboard },
  { href: "/employees", label: "Employee", icon: Users },
  { href: "/payroll", label: "Payroll", icon: PlayCircle },
  { href: "/attendance", label: "Workforce Management", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/workflows", label: "Workflow", icon: Workflow },
  { href: "/helpdesk", label: "Tasks", icon: ListChecks }
];

export function TopNav({
  footer,
  currentYear,
  currentMonth
}: {
  footer: React.ReactNode;
  currentYear: number;
  currentMonth: number;
}) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [appsOpen, setAppsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Click outside or route change closes whichever dropdown is open.
  useEffect(() => {
    setOpenGroup(null);
    setAppsOpen(false);
  }, [pathname]);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
        setAppsOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const activeGroup = NAV_GROUPS.find((g) => g.items.some((i) => pathname.startsWith(i.href)))?.label;

  return (
    <>
      <CommandPalette />

      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-3 left-3 z-40 bg-white border border-line rounded-lg p-2">
        <Menu size={18} />
      </button>

      <div ref={barRef} className="hidden md:flex flex-col border-b border-line bg-white sticky top-0 z-30">
        <div className="flex items-center px-5 h-14 border-b border-line">
          <div className="relative mr-3">
            <button
              onClick={() => setAppsOpen((v) => !v)}
              className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${appsOpen ? "bg-accentSoft text-accent" : "text-ink/50 hover:bg-paper hover:text-ink"}`}
              title="Your apps"
            >
              <Grid3x3 size={17} />
            </button>
            {appsOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-[220px] bg-white border border-line rounded-xl shadow-lifted py-1.5 z-40">
                <p className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-ink/30 uppercase">Your Apps</p>
                {APPS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Link
                      key={a.href}
                      href={a.href}
                      onClick={() => setAppsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink/70 hover:bg-accentSoft hover:text-accent transition-colors"
                    >
                      <Icon size={15} />
                      {a.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/dashboard" className="flex items-center gap-2 mr-6 shrink-0">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-sm font-mono tracking-wider text-ink/60 uppercase">Payroll OS</span>
          </Link>

          <nav className="flex items-center gap-1 flex-1">
            {NAV_GROUPS.map((group) => {
              const isActive = group.label === activeGroup;
              const isOpen = openGroup === group.label;
              return (
                <div key={group.label} className="relative">
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : group.label)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive || isOpen ? "bg-accentSoft text-accent" : "text-ink/60 hover:bg-paper hover:text-ink"
                    }`}
                  >
                    {group.label}
                    {group.items.length > 1 && <ChevronDown size={13} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                  </button>

                  {isOpen && group.items.length > 1 && (
                    <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white border border-line rounded-xl shadow-lifted py-1.5 z-40">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const itemActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpenGroup(null)}
                            className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                              itemActive ? "bg-accentSoft text-accent font-medium" : "text-ink/70 hover:bg-accentSoft hover:text-accent"
                            }`}
                          >
                            <Icon size={15} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <form action={setPayrollMonthCookie} className="flex items-center gap-1">
              <input type="hidden" name="redirect_to" value={pathname} />
              <select
                name="month"
                defaultValue={currentMonth}
                onChange={(e) => e.target.form!.requestSubmit()}
                className="text-xs border border-line rounded-lg px-2 py-1.5 bg-white text-ink/70"
                title="Payroll month (applies to Payroll, Payslips, and Reports)"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                name="year"
                defaultValue={currentYear}
                onChange={(e) => e.target.form!.requestSubmit()}
                className="text-xs border border-line rounded-lg px-2 py-1.5 bg-white text-ink/70"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </form>
            <div className="text-xs text-ink/40 truncate max-w-[160px]">{footer}</div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-white flex flex-col h-full overflow-y-auto">
            <div className="px-5 py-5 border-b border-line flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-mono tracking-wider text-ink/60 uppercase">Payroll OS</span>
              <button onClick={() => setMobileOpen(false)}><X size={18} /></button>
            </div>
            <nav className="flex-1 py-3">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="mb-1">
                  <p className="px-5 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-ink/30 uppercase">{group.label}</p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-5 py-1.5 text-sm transition-colors ${
                          active ? "bg-accentSoft text-accent font-medium" : "text-ink/70 hover:bg-accentSoft hover:text-accent"
                        }`}
                      >
                        <Icon size={15} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className="px-5 py-4 border-t border-line text-xs text-ink/40 truncate">{footer}</div>
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, User, Receipt, CalendarDays, ReceiptText, LifeBuoy, FileSliders } from "lucide-react";

const NAV = [
  { href: "/ess/profile", label: "My Profile", icon: User },
  { href: "/ess/payslips", label: "My Payslips", icon: Receipt },
  { href: "/ess/leave", label: "My Leave", icon: CalendarDays },
  { href: "/ess/reimbursements", label: "My Reimbursements", icon: ReceiptText },
  { href: "/ess/helpdesk", label: "Helpdesk", icon: LifeBuoy },
  { href: "/ess/tax-declaration", label: "Tax Declaration", icon: FileSliders }
];

export function EssSidebar({ footer }: { footer: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 py-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 px-5 py-2 text-sm transition-colors ${
              active ? "bg-accentSoft text-accent font-medium" : "text-ink/70 hover:bg-accentSoft hover:text-accent"
            }`}
          >
            <Icon size={15} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="md:hidden fixed top-3 left-3 z-40 bg-white border border-line rounded-lg p-2">
        <Menu size={18} />
      </button>
      <aside className="hidden md:flex w-56 border-r border-line bg-white flex-col">
        <div className="px-5 py-5 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-sm font-mono tracking-wider text-ink/60 uppercase">My Workspace</span>
          </div>
        </div>
        {nav}
        <div className="px-5 py-4 border-t border-line text-xs text-ink/40 truncate">{footer}</div>
      </aside>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white flex flex-col h-full">
            <div className="px-5 py-5 border-b border-line flex items-center justify-between">
              <span className="text-sm font-mono tracking-wider text-ink/60 uppercase">My Workspace</span>
              <button onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            {nav}
            <div className="px-5 py-4 border-t border-line text-xs text-ink/40 truncate">{footer}</div>
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

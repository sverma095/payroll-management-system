"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_GROUPS } from "@/lib/nav-data";
import { Menu, X } from "lucide-react";

export function Sidebar({ footer }: { footer: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 py-3 overflow-y-auto">
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
                onClick={() => setOpen(false)}
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
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="md:hidden fixed top-3 left-3 z-40 bg-white border border-line rounded-lg p-2">
        <Menu size={18} />
      </button>

      <aside className="hidden md:flex w-60 border-r border-line bg-white flex-col">
        <div className="px-5 py-5 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-sm font-mono tracking-wider text-ink/60 uppercase">Payroll OS</span>
          </div>
        </div>
        {nav}
        <div className="px-5 py-4 border-t border-line text-xs text-ink/40 truncate">{footer}</div>
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white flex flex-col h-full">
            <div className="px-5 py-5 border-b border-line flex items-center justify-between">
              <span className="text-sm font-mono tracking-wider text-ink/60 uppercase">Payroll OS</span>
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

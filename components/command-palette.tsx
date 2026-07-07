"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav-data";
import { Search } from "lucide-react";

type Flat = { href: string; label: string; group: string; icon: any };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const flat: Flat[] = useMemo(
    () => NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))),
    []
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flat;
    return flat.filter((i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q));
  }, [query, flat]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="md:hidden fixed top-3 right-3 z-40 bg-white border border-line rounded-lg p-2"
          title="Search"
        >
          <Search size={18} />
        </button>
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex fixed top-4 right-4 z-40 items-center gap-2 text-xs text-ink/40 bg-white border border-line rounded-lg px-2.5 py-1.5 hover:border-accent/40 hover:text-ink/60 transition-colors shadow-card"
          title="Search (Ctrl/Cmd+K)"
        >
          <Search size={13} />
          Search
          <kbd className="ml-2 text-[10px] border border-line rounded px-1 py-0.5 font-mono">⌘K</kbd>
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-lg bg-white rounded-xl shadow-lifted border border-line overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
          <Search size={16} className="text-ink/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && results[activeIndex]) {
                go(results[activeIndex].href);
              }
            }}
            placeholder="Jump to a page..."
            className="flex-1 text-sm outline-none"
          />
          <kbd className="text-[10px] border border-line rounded px-1 py-0.5 font-mono text-ink/40">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 && <p className="px-4 py-6 text-sm text-ink/40 text-center">No matches.</p>}
          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${
                  i === activeIndex ? "bg-accentSoft text-accent" : "text-ink/80"
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
                <span className="ml-auto text-[11px] text-ink/30">{item.group}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

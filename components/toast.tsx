"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function Toast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const message = searchParams.get("toast");
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 2500);
    const clean = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("toast");
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname);
    }, 2800);
    return () => {
      clearTimeout(hide);
      clearTimeout(clean);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg bg-ink text-white text-sm px-4 py-2.5 shadow-lifted transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
      }`}
    >
      <CheckCircle2 size={16} className="text-accent" />
      {message}
    </div>
  );
}

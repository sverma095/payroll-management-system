import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export function Alert({ type = "error", children }: { type?: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "bg-warn/10 border-warn/20 text-warn",
    success: "bg-accentSoft border-accent/20 text-accent",
    info: "bg-ink/5 border-line text-ink/70"
  };
  const Icon = type === "error" ? AlertCircle : type === "success" ? CheckCircle2 : Info;
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm mb-4 ${styles[type]}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

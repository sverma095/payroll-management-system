import { statusTone, TONE_CLASSES } from "@/lib/status-tone";

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = statusTone(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {label ?? status}
    </span>
  );
}

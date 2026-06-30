import { Inbox } from "lucide-react";

export function EmptyState({ message, icon: Icon = Inbox }: { message: string; icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-ink/40">
      <Icon size={28} className="mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

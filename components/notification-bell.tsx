import { createClient } from "@/lib/supabase/server";

export async function NotificationBell() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: notifs } = await supabase.from("notifications").select("id, title, read").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
  const unread = (notifs ?? []).filter((n) => !n.read).length;
  return (
    <div className="px-5 py-2 text-xs text-ink/60">
      🔔 {unread > 0 ? `${unread} new` : "No new notifications"}
    </div>
  );
}

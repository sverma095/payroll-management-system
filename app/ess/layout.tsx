import { NotificationBell } from "@/components/notification-bell";
import { EssSidebar } from "@/components/ess-sidebar";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";

export default async function EssLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { employeeId } = await resolveCompanyId(supabase);

  if (!employeeId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      <EssSidebar footer={<><NotificationBell />{user?.email}</>} />
      <main className="flex-1 bg-paper md:pt-0 pt-14">{children}</main>
    </div>
  );
}

import { NotificationBell } from "@/components/notification-bell";
import { TopNav } from "@/components/top-nav";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { resolvePeriod } from "@/lib/payroll-month";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { employeeId, companyId } = await resolveCompanyId(supabase);

  if (employeeId) {
    redirect("/ess/profile");
  }

  const { data: company } = companyId
    ? await supabase.from("companies").select("theme_color, logo_url").eq("id", companyId).maybeSingle()
    : { data: null };

  const { year, month } = resolvePeriod();

  return (
    <div className="min-h-screen flex flex-col" style={{ "--accent-color": company?.theme_color || "#2F5D50" } as React.CSSProperties}>
      <TopNav footer={<><NotificationBell />{user?.email}</>} currentYear={year} currentMonth={month} />
      <main className="flex-1 bg-paper md:pt-0 pt-14">{children}</main>
    </div>
  );
}

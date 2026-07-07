"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyUser } from "@/lib/notify";

export async function resolveTicket(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("helpdesk_tickets").update({ status: "resolved" }).eq("id", id);
  if (error) {
    redirect(`/helpdesk?error=${encodeURIComponent(error.message)}`);
  }

  const { data: t } = await supabase.from("helpdesk_tickets").select("employee_id, subject").eq("id", id).maybeSingle();
  if (t) {
    const { data: appUser } = await supabase.from("app_users").select("id").eq("employee_id", t.employee_id).maybeSingle();
    if (appUser) {
      await notifyUser(supabase, appUser.id, "Ticket resolved", t.subject);
    }
  }
  revalidatePath("/helpdesk");
}

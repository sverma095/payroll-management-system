"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resolveTicket(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("helpdesk_tickets").update({ status: "resolved" }).eq("id", id);

  const { data: t } = await supabase.from("helpdesk_tickets").select("employee_id, subject").eq("id", id).maybeSingle();
  if (t) {
    const { data: appUser } = await supabase.from("app_users").select("id").eq("employee_id", t.employee_id).maybeSingle();
    if (appUser) {
      await supabase.from("notifications").insert({ user_id: appUser.id, title: "Ticket resolved", body: t.subject });
    }
  }
  revalidatePath("/helpdesk");
}

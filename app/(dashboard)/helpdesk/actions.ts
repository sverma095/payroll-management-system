"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resolveTicket(formData: FormData) {
  const supabase = createClient();
  await supabase.from("helpdesk_tickets").update({ status: "resolved" }).eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/helpdesk");
}

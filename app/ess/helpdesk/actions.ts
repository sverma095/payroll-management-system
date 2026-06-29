"use server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";

export async function raiseTicket(formData: FormData) {
  const supabase = createClient();
  const { employeeId } = await resolveCompanyId(supabase);
  if (!employeeId) return;
  await supabase.from("helpdesk_tickets").insert({
    employee_id: employeeId,
    subject: String(formData.get("subject") ?? ""),
    description: String(formData.get("description") ?? "")
  });
  revalidatePath("/ess/helpdesk");
}

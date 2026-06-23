"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function applyMyLeave(formData: FormData) {
  const supabase = createClient();
  const { employeeId } = await resolveCompanyId(supabase);

  if (!employeeId) {
    redirect(`/ess/leave?error=${encodeURIComponent("No employee profile found")}`);
  }

  const from_date = String(formData.get("from_date") ?? "");
  const to_date = String(formData.get("to_date") ?? "");
  if (new Date(to_date) < new Date(from_date)) {
    redirect(`/ess/leave?error=${encodeURIComponent("To date can't be before from date")}`);
  }

  const { error } = await supabase.from("leave_applications").insert({
    employee_id: employeeId,
    leave_type_id: String(formData.get("leave_type_id") ?? ""),
    from_date,
    to_date,
    status: "pending"
  });

  if (error) {
    redirect(`/ess/leave?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/ess/leave");
}

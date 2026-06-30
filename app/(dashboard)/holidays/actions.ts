"use server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";

export async function addHoliday(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) return;
  await supabase.from("holidays").insert({
    company_id: companyId,
    holiday_date: String(formData.get("holiday_date") ?? ""),
    name: String(formData.get("name") ?? "")
  });
  revalidatePath("/holidays");
}

export async function deleteHoliday(formData: FormData) {
  const supabase = createClient();
  await supabase.from("holidays").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/holidays");
}

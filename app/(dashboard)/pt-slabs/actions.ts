"use server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";

export async function addPtSlab(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) return;
  await supabase.from("pt_slabs").insert({
    company_id: companyId,
    state: String(formData.get("state") ?? ""),
    min_gross: Number(formData.get("min_gross") ?? 0),
    max_gross: Number(formData.get("max_gross") ?? 0) || null,
    pt_amount: Number(formData.get("pt_amount") ?? 0)
  });
  revalidatePath("/pt-slabs");
}

export async function deletePtSlab(formData: FormData) {
  const supabase = createClient();
  await supabase.from("pt_slabs").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/pt-slabs");
}

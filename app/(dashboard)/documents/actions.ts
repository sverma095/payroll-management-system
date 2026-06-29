"use server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";

export async function addDocument(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) return;
  await supabase.from("documents").insert({
    company_id: companyId,
    employee_id: String(formData.get("employee_id") ?? "") || null,
    doc_name: String(formData.get("doc_name") ?? ""),
    doc_url: String(formData.get("doc_url") ?? ""),
    category: String(formData.get("category") ?? "general")
  });
  revalidatePath("/documents");
}

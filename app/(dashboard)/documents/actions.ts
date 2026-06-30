"use server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";

export async function addDocument(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) return;

  const file = formData.get("file") as File | null;
  let doc_url = String(formData.get("doc_url") ?? "");

  if (file && file.size > 0) {
    const path = `${companyId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (!error) {
      doc_url = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
    }
  }

  await supabase.from("documents").insert({
    company_id: companyId,
    employee_id: String(formData.get("employee_id") ?? "") || null,
    doc_name: String(formData.get("doc_name") ?? ""),
    doc_url,
    category: String(formData.get("category") ?? "general")
  });
  revalidatePath("/documents");
}

export async function deleteDocument(formData: FormData) {
  const supabase = createClient();
  await supabase.from("documents").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/documents");
}

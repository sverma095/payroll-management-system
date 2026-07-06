"use server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addDocument(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) return;

  const file = formData.get("file") as File | null;
  let doc_url = String(formData.get("doc_url") ?? "");

  if (file && file.size > 0) {
    const path = `${companyId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
    if (uploadError) {
      // Previously swallowed - the form would appear to succeed while
      // silently inserting a document row with no file behind it.
      redirect(`/documents?error=${encodeURIComponent(`Upload failed: ${uploadError.message}`)}`);
    }
    doc_url = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("documents").insert({
    company_id: companyId,
    employee_id: String(formData.get("employee_id") ?? "") || null,
    doc_name: String(formData.get("doc_name") ?? ""),
    doc_url,
    category: String(formData.get("category") ?? "general"),
    expiry_date: String(formData.get("expiry_date") ?? "") || null
  });
  if (error) {
    redirect(`/documents?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/documents");
}

export async function deleteDocument(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("documents").delete().eq("id", String(formData.get("id") ?? ""));
  if (error) {
    redirect(`/documents?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/documents");
}

"use server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveSubscription(formData: FormData) {
  const supabase = createClient();
  const { tenantId } = await resolveCompanyId(supabase);
  if (!tenantId) return;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      tenant_id: tenantId,
      plan: String(formData.get("plan") ?? "trial"),
      seats: Number(formData.get("seats") ?? 10),
      status: "active",
      renews_on: String(formData.get("renews_on") ?? "") || null
    },
    { onConflict: "tenant_id" }
  );
  if (error) {
    redirect(`/billing?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/billing");
}

export async function saveBranding(formData: FormData) {
  const supabase = createClient();
  const companyId = String(formData.get("company_id") ?? "");
  const { error } = await supabase
    .from("companies")
    .update({
      logo_url: String(formData.get("logo_url") ?? "") || null,
      theme_color: String(formData.get("theme_color") ?? "#2F5D50")
    })
    .eq("id", companyId);
  if (error) {
    redirect(`/billing?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/billing");
}

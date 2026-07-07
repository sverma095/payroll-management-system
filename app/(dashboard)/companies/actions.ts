"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PAN_REGEX, TAN_REGEX, GSTIN_REGEX } from "@/lib/validators/india";

const companySchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  legal_name: z.string().min(2, "Legal name is required"),
  pan: z.string().regex(PAN_REGEX, "PAN must look like ABCDE1234F"),
  tan: z
    .string()
    .regex(TAN_REGEX, "TAN must look like ABCD12345E")
    .optional()
    .or(z.literal("")),
  gstin: z
    .string()
    .regex(GSTIN_REGEX, "GSTIN format looks invalid")
    .optional()
    .or(z.literal("")),
  cin: z.string().optional().or(z.literal("")),
  pf_number: z.string().optional().or(z.literal("")),
  esi_number: z.string().optional().or(z.literal(""))
});

export async function createCompany(formData: FormData) {
  const raw = {
    company_name: String(formData.get("company_name") ?? ""),
    legal_name: String(formData.get("legal_name") ?? ""),
    pan: String(formData.get("pan") ?? "").toUpperCase(),
    tan: String(formData.get("tan") ?? "").toUpperCase(),
    gstin: String(formData.get("gstin") ?? "").toUpperCase(),
    cin: String(formData.get("cin") ?? "").toUpperCase(),
    pf_number: String(formData.get("pf_number") ?? ""),
    esi_number: String(formData.get("esi_number") ?? "")
  };

  const parsed = companySchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    redirect(`/companies/new?error=${encodeURIComponent(message)}`);
  }

  const supabase = createClient();

  const { data: authData } = await supabase.auth.getUser();
  const { data: appUser } = await supabase
    .from("app_users")
    .select("tenant_id")
    .eq("id", authData.user?.id)
    .single();

  if (!appUser) {
    redirect(`/companies/new?error=${encodeURIComponent("No tenant found for this user")}`);
  }

  // Acceptance criteria: duplicate PAN must be restricted (within the tenant)
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("tenant_id", appUser!.tenant_id)
    .eq("pan", raw.pan)
    .maybeSingle();

  if (existing) {
    redirect(`/companies/new?error=${encodeURIComponent("A company with this PAN already exists")}`);
  }

  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      tenant_id: appUser!.tenant_id,
      company_name: raw.company_name,
      legal_name: raw.legal_name,
      pan: raw.pan,
      tan: raw.tan || null,
      gstin: raw.gstin || null,
      cin: raw.cin || null,
      pf_number: raw.pf_number || null,
      esi_number: raw.esi_number || null
    })
    .select()
    .single();

  if (error) {
    redirect(`/companies/new?error=${encodeURIComponent(error.message)}`);
  }

  // Acceptance criteria: audit log should be generated
  await supabase.from("audit_logs").insert({
    user_id: authData.user?.id,
    tenant_id: appUser!.tenant_id,
    module_name: "company_management",
    action: "create_company",
    old_value_json: null,
    new_value_json: company
  });

  redirect("/companies");
}

export async function updateCompany(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");
  const raw = {
    company_name: String(formData.get("company_name") ?? ""),
    legal_name: String(formData.get("legal_name") ?? ""),
    pan: String(formData.get("pan") ?? "").toUpperCase(),
    tan: String(formData.get("tan") ?? "").toUpperCase(),
    gstin: String(formData.get("gstin") ?? "").toUpperCase(),
    cin: String(formData.get("cin") ?? "").toUpperCase(),
    pf_number: String(formData.get("pf_number") ?? ""),
    esi_number: String(formData.get("esi_number") ?? "")
  };

  const parsed = companySchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    redirect(`/settings?error=${encodeURIComponent(message)}`);
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { tenantId } = await resolveCompanyId(supabase);

  const { error } = await supabase
    .from("companies")
    .update({
      company_name: raw.company_name,
      legal_name: raw.legal_name,
      pan: raw.pan,
      tan: raw.tan || null,
      gstin: raw.gstin || null,
      cin: raw.cin || null,
      pf_number: raw.pf_number || null,
      esi_number: raw.esi_number || null
    })
    .eq("id", companyId);

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_logs").insert({
    user_id: user?.id,
    tenant_id: tenantId,
    module_name: "company_management",
    action: "update_company",
    old_value_json: null,
    new_value_json: raw
  });

  redirect("/settings?toast=Company+details+updated");
}

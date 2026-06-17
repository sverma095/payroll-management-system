import { SupabaseClient } from "@supabase/supabase-js";

export async function resolveCompanyId(
  supabase: SupabaseClient,
  requestedCompanyId?: string | null
): Promise<{ companyId: string | null; tenantId: string | null; isTenantAdmin: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { companyId: null, tenantId: null, isTenantAdmin: false };

  const { data: appUser } = await supabase
    .from("app_users")
    .select("company_id, tenant_id")
    .eq("id", user.id)
    .single();

  if (!appUser) return { companyId: null, tenantId: null, isTenantAdmin: false };

  // Company-scoped user: always their own company, ignore any requested override
  if (appUser.company_id) {
    return { companyId: appUser.company_id, tenantId: appUser.tenant_id, isTenantAdmin: false };
  }

  // Tenant admin: honour an explicit company selection if it belongs to this tenant
  if (requestedCompanyId) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("id", requestedCompanyId)
      .eq("tenant_id", appUser.tenant_id)
      .maybeSingle();
    if (company) return { companyId: company.id, tenantId: appUser.tenant_id, isTenantAdmin: true };
  }

  // Fall back to the first company in the tenant
  const { data: firstCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("tenant_id", appUser.tenant_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { companyId: firstCompany?.id ?? null, tenantId: appUser.tenant_id, isTenantAdmin: true };
}

import { SupabaseClient } from "@supabase/supabase-js";

export async function resolveCompanyId(
  supabase: SupabaseClient,
  requestedCompanyId?: string | null
): Promise<{ companyId: string | null; tenantId: string | null; isTenantAdmin: boolean }> {
  const { data, error } = await supabase
    .rpc("resolve_current_company", { requested_company_id: requestedCompanyId ?? null })
    .maybeSingle();

  const row = data as { company_id: string | null; tenant_id: string | null; is_tenant_admin: boolean } | null;

  if (error || !row) {
    return { companyId: null, tenantId: null, isTenantAdmin: false };
  }

  return {
    companyId: row.company_id ?? null,
    tenantId: row.tenant_id ?? null,
    isTenantAdmin: !!row.is_tenant_admin
  };
}

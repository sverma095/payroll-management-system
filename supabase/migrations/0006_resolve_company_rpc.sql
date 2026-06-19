-- ============================================================================
-- Performance: resolveCompanyId() was making up to 3 sequential round trips
-- per page load (getUser, app_users lookup, companies fallback). This single
-- RPC does the same logic server-side in one round trip. security invoker
-- keeps existing RLS policies in force — this is a convenience wrapper, not
-- a privilege escalation.
-- ============================================================================

create or replace function resolve_current_company(requested_company_id uuid default null)
returns table(company_id uuid, tenant_id uuid, is_tenant_admin boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_company_id uuid;
  v_tenant_id uuid;
begin
  select au.company_id, au.tenant_id into v_company_id, v_tenant_id
  from app_users au where au.id = auth.uid();

  if v_tenant_id is null then
    return;
  end if;

  if v_company_id is not null then
    return query select v_company_id, v_tenant_id, false;
    return;
  end if;

  if requested_company_id is not null and exists (
    select 1 from companies c where c.id = requested_company_id and c.tenant_id = v_tenant_id
  ) then
    return query select requested_company_id, v_tenant_id, true;
    return;
  end if;

  return query
    select c.id, v_tenant_id, true
    from companies c
    where c.tenant_id = v_tenant_id
    order by c.created_at asc
    limit 1;
end;
$$;

grant execute on function resolve_current_company(uuid) to authenticated;

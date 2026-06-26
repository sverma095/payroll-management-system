create table insurance_policies (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  policy_name varchar(150) not null,
  policy_number varchar(100),
  sum_insured numeric(14,2) not null,
  premium numeric(14,2) not null default 0,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now()
);
alter table insurance_policies enable row level security;
create policy insurance_isolation on insurance_policies
  for all using (
    employee_id in (
      select e.id from employees e join companies c on c.id = e.company_id
      where c.tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or c.id = auth_company_id())
    )
  );
create policy insurance_self_select on insurance_policies
  for select using (employee_id = auth_employee_id());

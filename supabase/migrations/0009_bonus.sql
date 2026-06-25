create table bonuses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  financial_year varchar(9) not null,
  basic_wages numeric(14,2) not null,
  bonus_percentage numeric(5,2) not null default 8.33,
  bonus_amount numeric(14,2) not null,
  status varchar(20) not null default 'approved',
  payout_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  constraint uq_bonus_employee_fy unique (employee_id, financial_year)
);

alter table bonuses enable row level security;
create policy bonuses_isolation on bonuses
  for all using (
    employee_id in (
      select e.id from employees e join companies c on c.id = e.company_id
      where c.tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or c.id = auth_company_id())
    )
  );
create policy bonuses_self_select on bonuses
  for select using (employee_id = auth_employee_id());

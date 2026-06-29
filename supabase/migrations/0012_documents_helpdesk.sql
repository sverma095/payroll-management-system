create table documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  doc_name varchar(150) not null,
  doc_url text not null,
  category varchar(50) not null default 'general',
  created_at timestamptz not null default now()
);
alter table documents enable row level security;
create policy documents_isolation on documents for all using (
  company_id in (select id from companies where tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or id = auth_company_id()))
);
create policy documents_self_select on documents for select using (employee_id = auth_employee_id() or employee_id is null);

create table helpdesk_tickets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  subject varchar(200) not null,
  description text,
  status varchar(20) not null default 'open',
  created_at timestamptz not null default now()
);
alter table helpdesk_tickets enable row level security;
create policy helpdesk_isolation on helpdesk_tickets for all using (
  employee_id in (select e.id from employees e join companies c on c.id=e.company_id where c.tenant_id=auth_tenant_id() and (auth_is_tenant_admin() or c.id=auth_company_id()))
);
create policy helpdesk_self_all on helpdesk_tickets for all using (employee_id = auth_employee_id()) with check (employee_id = auth_employee_id());

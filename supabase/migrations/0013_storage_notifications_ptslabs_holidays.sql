insert into storage.buckets (id, name, public) values ('documents', 'documents', true) on conflict (id) do nothing;
create policy "documents_upload" on storage.objects for insert to authenticated with check (bucket_id = 'documents');
create policy "documents_read" on storage.objects for select using (bucket_id = 'documents');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title varchar(200) not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;
create policy notifications_own on notifications for all using (user_id = auth.uid());

create table pt_slabs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  state varchar(100) not null,
  min_gross numeric(14,2) not null,
  max_gross numeric(14,2),
  pt_amount numeric(14,2) not null
);
alter table pt_slabs enable row level security;
create policy pt_slabs_isolation on pt_slabs for all using (
  company_id in (select id from companies where tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or id = auth_company_id()))
);

create table holidays (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  holiday_date date not null,
  name varchar(150) not null,
  constraint uq_holiday unique (company_id, holiday_date)
);
alter table holidays enable row level security;
create policy holidays_isolation on holidays for all using (
  company_id in (select id from companies where tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or id = auth_company_id()))
);
create policy holidays_self_select on holidays for select using (
  company_id = (select company_id from auth_employee_row())
);

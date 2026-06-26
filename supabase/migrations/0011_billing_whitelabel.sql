create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  plan varchar(30) not null default 'trial',
  seats int not null default 10,
  status varchar(20) not null default 'active',
  renews_on date,
  created_at timestamptz not null default now(),
  constraint uq_subscription_tenant unique (tenant_id)
);
alter table subscriptions enable row level security;
create policy subscriptions_isolation on subscriptions
  for all using (tenant_id = auth_tenant_id() and auth_is_tenant_admin());

alter table companies add column logo_url text;
alter table companies add column theme_color varchar(7) default '#2F5D50';

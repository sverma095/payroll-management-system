-- Recruitment / onboarding module. Mirrors the RLS shape used everywhere
-- else in this schema: job_postings carries company_id directly (same
-- pattern as employees); candidates/interviews/offers scope through the
-- parent chain (same pattern as leave_applications scoping through
-- employees -> companies).

create table if not exists job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title varchar not null,
  department_id uuid references departments(id),
  designation_id uuid references designations(id),
  employment_type varchar not null default 'full_time',
  location varchar,
  description text,
  openings_count integer not null default 1,
  status varchar not null default 'open', -- open | on_hold | closed
  created_at timestamptz not null default now()
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  job_posting_id uuid not null references job_postings(id) on delete cascade,
  full_name varchar not null,
  email varchar not null,
  phone varchar,
  resume_url text,
  source varchar, -- referral | job_board | direct | agency ...
  stage varchar not null default 'applied', -- applied | screening | interview | offer | hired | rejected
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  scheduled_at timestamptz not null,
  interviewer_name varchar not null,
  mode varchar not null default 'video', -- video | phone | in_person
  feedback text,
  rating integer,
  status varchar not null default 'scheduled', -- scheduled | completed | cancelled
  created_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  offered_ctc numeric not null,
  joining_date date,
  status varchar not null default 'draft', -- draft | sent | accepted | declined | withdrawn
  created_at timestamptz not null default now()
);

alter table job_postings enable row level security;
alter table candidates enable row level security;
alter table interviews enable row level security;
alter table offers enable row level security;

drop policy if exists job_postings_isolation on job_postings;
create policy job_postings_isolation on job_postings for all using (
  company_id in (
    select id from companies
    where tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or id = auth_company_id())
  )
);

drop policy if exists candidates_isolation on candidates;
create policy candidates_isolation on candidates for all using (
  job_posting_id in (
    select jp.id from job_postings jp
    join companies c on c.id = jp.company_id
    where c.tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or c.id = auth_company_id())
  )
);

drop policy if exists interviews_isolation on interviews;
create policy interviews_isolation on interviews for all using (
  candidate_id in (
    select cd.id from candidates cd
    join job_postings jp on jp.id = cd.job_posting_id
    join companies c on c.id = jp.company_id
    where c.tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or c.id = auth_company_id())
  )
);

drop policy if exists offers_isolation on offers;
create policy offers_isolation on offers for all using (
  candidate_id in (
    select cd.id from candidates cd
    join job_postings jp on jp.id = cd.job_posting_id
    join companies c on c.id = jp.company_id
    where c.tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or c.id = auth_company_id())
  )
);

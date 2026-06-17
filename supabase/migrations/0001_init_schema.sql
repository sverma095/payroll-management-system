-- ============================================================================
-- Payroll Management System (India) — Initial Schema
-- Phase 1 + Phase 2 tables per Database_Design_Document.pdf
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- TENANTS (SaaS root)
-- ----------------------------------------------------------------------------
create table tenants (
  id uuid primary key default gen_random_uuid(),
  tenant_name varchar(200) not null,
  tenant_code varchar(50) not null unique,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- COMPANIES (legal entities under a tenant)
-- ----------------------------------------------------------------------------
create table companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  company_name varchar(200) not null,
  legal_name varchar(200) not null,
  pan varchar(10) not null,
  tan varchar(10),
  gstin varchar(15),
  cin varchar(21),
  pf_number varchar(30),
  esi_number varchar(30),
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_company_pan_per_tenant unique (tenant_id, pan)
);
create index idx_companies_pan on companies(pan);
create index idx_companies_gstin on companies(gstin);
create index idx_companies_tan on companies(tan);

-- ----------------------------------------------------------------------------
-- BRANCHES
-- ----------------------------------------------------------------------------
create table branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  branch_name varchar(150) not null,
  state varchar(100) not null,
  city varchar(100) not null,
  address text,
  pt_applicable boolean not null default false,
  lwf_applicable boolean not null default false,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_branches_company on branches(company_id);

-- ----------------------------------------------------------------------------
-- DEPARTMENTS
-- ----------------------------------------------------------------------------
create table departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  department_name varchar(150) not null,
  department_code varchar(50) not null,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_dept_code_per_company unique (company_id, department_code)
);
create index idx_departments_company on departments(company_id);

-- ----------------------------------------------------------------------------
-- DESIGNATIONS
-- ----------------------------------------------------------------------------
create table designations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  designation_name varchar(150) not null,
  designation_code varchar(50) not null,
  grade varchar(50),
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_desig_code_per_company unique (company_id, designation_code)
);
create index idx_designations_company on designations(company_id);

-- ----------------------------------------------------------------------------
-- EMPLOYEES
-- ----------------------------------------------------------------------------
create table employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_code varchar(50) not null,
  first_name varchar(100) not null,
  last_name varchar(100),
  dob date,
  doj date not null,
  gender varchar(20),
  pan varchar(10),
  aadhaar varchar(20),
  uan varchar(20),
  esic_number varchar(30),
  department_id uuid references departments(id),
  designation_id uuid references designations(id),
  branch_id uuid references branches(id),
  manager_id uuid references employees(id),
  status varchar(30) not null default 'draft'
    check (status in ('draft','active','probation','confirmed','notice_period','relieved','ff_completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_employee_code_per_company unique (company_id, employee_code)
);
create index idx_employees_company on employees(company_id);
create index idx_employees_pan on employees(pan);
create index idx_employees_uan on employees(uan);
create index idx_employees_esic on employees(esic_number);

-- ----------------------------------------------------------------------------
-- EMPLOYEE_BANKS
-- ----------------------------------------------------------------------------
create table employee_banks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  bank_name varchar(150) not null,
  account_number varchar(40) not null,
  ifsc varchar(11) not null,
  beneficiary_name varchar(150) not null,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_employee_banks_employee on employee_banks(employee_id);

-- ----------------------------------------------------------------------------
-- SALARY_COMPONENTS (component master, scoped to company)
-- ----------------------------------------------------------------------------
create table salary_components (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  component_name varchar(150) not null,
  component_code varchar(50) not null,
  component_type varchar(20) not null check (component_type in ('earning','deduction','employer_contribution')),
  earning boolean not null default false,
  deduction boolean not null default false,
  employer_contribution boolean not null default false,
  taxable boolean not null default true,
  pf_applicable boolean not null default false,
  esi_applicable boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_component_code_per_company unique (company_id, component_code)
);
create index idx_salary_components_company on salary_components(company_id);

-- ----------------------------------------------------------------------------
-- SALARY_STRUCTURES
-- ----------------------------------------------------------------------------
create table salary_structures (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  structure_name varchar(150) not null,
  effective_from date not null,
  effective_to date,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_salary_structures_company on salary_structures(company_id);

-- ----------------------------------------------------------------------------
-- SALARY_STRUCTURE_DETAILS (formula lines, versioned by effective_from)
-- ----------------------------------------------------------------------------
create table salary_structure_details (
  id uuid primary key default gen_random_uuid(),
  salary_structure_id uuid not null references salary_structures(id) on delete cascade,
  component_id uuid not null references salary_components(id),
  formula text not null,
  sequence int not null default 0,
  effective_from date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_ssd_structure on salary_structure_details(salary_structure_id);

-- ----------------------------------------------------------------------------
-- ATTENDANCE
-- ----------------------------------------------------------------------------
create table attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  attendance_date date not null,
  shift varchar(50),
  status varchar(30) not null default 'present',
  working_hours numeric(5,2) default 0,
  overtime_hours numeric(5,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_attendance_employee_date unique (employee_id, attendance_date)
);
create index idx_attendance_employee on attendance(employee_id);
create index idx_attendance_date on attendance(attendance_date);

-- ----------------------------------------------------------------------------
-- LEAVE_TYPES
-- ----------------------------------------------------------------------------
create table leave_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  leave_name varchar(100) not null,
  leave_code varchar(20) not null,
  annual_limit numeric(5,2) not null default 0,
  carry_forward boolean not null default false,
  encashment_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_leave_code_per_company unique (company_id, leave_code)
);

-- ----------------------------------------------------------------------------
-- LEAVE_APPLICATIONS
-- ----------------------------------------------------------------------------
create table leave_applications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type_id uuid not null references leave_types(id),
  from_date date not null,
  to_date date not null,
  status varchar(20) not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  approved_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_leave_app_employee on leave_applications(employee_id);

-- ----------------------------------------------------------------------------
-- PAYROLL_HEADERS
-- ----------------------------------------------------------------------------
create table payroll_headers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  status varchar(20) not null default 'draft' check (status in ('draft','processed','approved','locked')),
  processed_by uuid,
  processed_on timestamptz,
  approved_by uuid,
  approved_on timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_payroll_period_per_company unique (company_id, month, year)
);
create index idx_payroll_headers_company on payroll_headers(company_id);

-- ----------------------------------------------------------------------------
-- PAYROLL_DETAILS
-- ----------------------------------------------------------------------------
create table payroll_details (
  id uuid primary key default gen_random_uuid(),
  payroll_header_id uuid not null references payroll_headers(id) on delete cascade,
  employee_id uuid not null references employees(id),
  gross_salary numeric(14,2) not null default 0,
  total_deduction numeric(14,2) not null default 0,
  net_salary numeric(14,2) not null default 0,
  pf numeric(14,2) not null default 0,
  esi numeric(14,2) not null default 0,
  pt numeric(14,2) not null default 0,
  lwf numeric(14,2) not null default 0,
  tds numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_payroll_detail_employee unique (payroll_header_id, employee_id)
);
create index idx_payroll_details_header on payroll_details(payroll_header_id);
create index idx_payroll_details_employee on payroll_details(employee_id);

-- ----------------------------------------------------------------------------
-- PAYSLIPS
-- ----------------------------------------------------------------------------
create table payslips (
  id uuid primary key default gen_random_uuid(),
  payroll_detail_id uuid not null references payroll_details(id) on delete cascade,
  pdf_path text,
  generated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TAX_DECLARATIONS
-- ----------------------------------------------------------------------------
create table tax_declarations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  financial_year varchar(9) not null,
  regime varchar(10) not null check (regime in ('old','new')),
  declared_amount numeric(14,2) not null default 0,
  status varchar(20) not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_tax_decl_employee_fy unique (employee_id, financial_year)
);

-- ----------------------------------------------------------------------------
-- INVESTMENT_PROOFS
-- ----------------------------------------------------------------------------
create table investment_proofs (
  id uuid primary key default gen_random_uuid(),
  declaration_id uuid not null references tax_declarations(id) on delete cascade,
  document_path text not null,
  verified_by uuid,
  verified_date timestamptz,
  status varchar(20) not null default 'pending'
);

-- ----------------------------------------------------------------------------
-- PERFORMANCE_RATINGS
-- ----------------------------------------------------------------------------
create table performance_ratings (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  review_period varchar(20) not null,
  rating numeric(3,1),
  reviewer uuid,
  approved_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- VARIABLE_PAY
-- ----------------------------------------------------------------------------
create table variable_pay (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  variable_type varchar(50) not null,
  allocated_amount numeric(14,2) not null default 0,
  approved_amount numeric(14,2) not null default 0,
  payout_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- LOANS
-- ----------------------------------------------------------------------------
create table loans (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  loan_amount numeric(14,2) not null,
  interest_rate numeric(5,2) not null default 0,
  emi_amount numeric(14,2) not null,
  outstanding_balance numeric(14,2) not null,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- REIMBURSEMENTS
-- ----------------------------------------------------------------------------
create table reimbursements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  claim_type varchar(100) not null,
  claim_amount numeric(14,2) not null,
  approved_amount numeric(14,2) default 0,
  status varchar(20) not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- FULL_AND_FINAL
-- ----------------------------------------------------------------------------
create table full_and_final (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  salary_amount numeric(14,2) not null default 0,
  leave_encashment numeric(14,2) not null default 0,
  gratuity numeric(14,2) not null default 0,
  recoveries numeric(14,2) not null default 0,
  notice_pay numeric(14,2) not null default 0,
  net_payable numeric(14,2) not null default 0,
  status varchar(20) not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- WORKFLOWS / WORKFLOW_STEPS
-- ----------------------------------------------------------------------------
create table workflows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  workflow_name varchar(150) not null,
  module_name varchar(100) not null,
  version int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  step_no int not null,
  approver_role varchar(100) not null,
  condition_json jsonb,
  created_at timestamptz not null default now()
);
create index idx_workflow_steps_workflow on workflow_steps(workflow_id);

-- ----------------------------------------------------------------------------
-- AUDIT_LOGS
-- ----------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  module_name varchar(100) not null,
  action varchar(50) not null,
  old_value_json jsonb,
  new_value_json jsonb,
  ip_address varchar(50),
  created_at timestamptz not null default now()
);
create index idx_audit_logs_module on audit_logs(module_name);
create index idx_audit_logs_created on audit_logs(created_at);

-- ----------------------------------------------------------------------------
-- USER_ROLES / ROLE_PERMISSIONS
-- ----------------------------------------------------------------------------
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  role_name varchar(100) not null,
  description text,
  created_at timestamptz not null default now()
);

create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references user_roles(id) on delete cascade,
  module_name varchar(100) not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_approve boolean not null default false,
  can_delete boolean not null default false,
  can_export boolean not null default false,
  constraint uq_role_module unique (role_id, module_name)
);

-- ----------------------------------------------------------------------------
-- APP_USERS — links Supabase auth.users to a tenant/company/role
-- (not in the original design doc, but required to enforce data isolation)
-- ----------------------------------------------------------------------------
create table app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  role_id uuid references user_roles(id),
  full_name varchar(200),
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_app_users_tenant on app_users(tenant_id);
create index idx_app_users_company on app_users(company_id);

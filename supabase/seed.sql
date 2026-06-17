-- ============================================================================
-- Baseline roles + permissions (Phase 1 modules)
-- Run after migrations, once per tenant setup if you want fresh role rows
-- (these are reference data, not tenant-scoped, per the design doc).
-- ============================================================================

insert into user_roles (role_name, description) values
  ('super_admin', 'Full access across all companies in the tenant'),
  ('company_admin', 'Full access within a single company'),
  ('hr', 'Manages employees, attendance, leave and payroll inputs'),
  ('finance', 'Approves and locks payroll, views compliance reports'),
  ('manager', 'Approves leave and variable pay for direct reports'),
  ('employee', 'Self-service: own profile, payslips, leave requests')
on conflict do nothing;

-- Phase 1 module permission matrix
with roles as (select id, role_name from user_roles),
modules as (
  select unnest(array[
    'company_management','employee_management','salary_structure',
    'attendance','leave','payroll_processing','pf','esi','pt','lwf','tds',
    'payslip','employee_self_service','full_and_final'
  ]) as module_name
)
insert into role_permissions (role_id, module_name, can_view, can_create, can_edit, can_approve, can_delete, can_export)
select
  r.id,
  m.module_name,
  true,
  r.role_name in ('super_admin','company_admin','hr','finance'),
  r.role_name in ('super_admin','company_admin','hr'),
  r.role_name in ('super_admin','company_admin','finance','manager'),
  r.role_name in ('super_admin','company_admin'),
  r.role_name in ('super_admin','company_admin','finance')
from roles r
cross join modules m
on conflict (role_id, module_name) do nothing;

-- ============================================================================
-- Phase 2: Employee self-service for reimbursement claims.
-- Admin/company-wide access to loans/reimbursements/variable_pay/
-- performance_ratings already exists from migration 0002. This adds the
-- narrow "submit and track my own claims" path for ESS users.
-- ============================================================================

create policy reimbursements_self_all on reimbursements
  for all
  using (employee_id = auth_employee_id())
  with check (employee_id = auth_employee_id());

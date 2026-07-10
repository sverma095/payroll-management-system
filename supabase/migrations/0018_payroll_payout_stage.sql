-- Adds the "Payout" stage the video's workflow has (Process -> Verify ->
-- Payout -> Published Info) that this app previously had no equivalent
-- for at all - locking a payroll run was the last step, with no way to
-- record that salaries were actually disbursed.
alter table payroll_headers add column if not exists paid_by uuid;
alter table payroll_headers add column if not exists paid_on timestamptz;

alter table payroll_headers drop constraint if exists payroll_headers_status_check;
alter table payroll_headers add constraint payroll_headers_status_check
  check (status in ('draft', 'processed', 'approved', 'locked', 'paid'));

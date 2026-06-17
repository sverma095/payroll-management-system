-- ============================================================================
-- Search performance: SRS Module 2 acceptance criteria —
-- "Employee should be searchable within 2 seconds."
-- ============================================================================

create extension if not exists pg_trgm;

create index idx_employees_first_name_trgm on employees using gin (first_name gin_trgm_ops);
create index idx_employees_last_name_trgm on employees using gin (last_name gin_trgm_ops);
create index idx_employees_code_trgm on employees using gin (employee_code gin_trgm_ops);
create index idx_employees_pan_trgm on employees using gin (pan gin_trgm_ops);

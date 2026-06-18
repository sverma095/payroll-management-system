# Payroll Management System (India)

Multi-tenant SaaS payroll platform. Built from the handover package:
BRD → PRD → SRS → Database Design → UI/UX Spec → Reports Catalogue → UAT Plan.

## Stack
- **App**: Next.js 14 (App Router, TypeScript), Tailwind CSS
- **Database/Auth**: Supabase (Postgres + Row Level Security + Auth)
- **Hosting**: Vercel
- **Source control**: GitHub

## Status

**Live infrastructure**
- Supabase project **`payroll-management-system`** created (region `ap-south-1`,
  ref `pmssjdauwuutwuxrhqmz`) — all 4 migrations + seed applied, security
  advisor clean except the 3 expected `authenticated`-role warnings on the
  RLS helper functions (required for row-level security to evaluate; see
  `0004_security_hardening.sql` for what was already locked down).
- Vercel: not connected yet.
- GitHub: not connected yet — no GitHub connector available, so this repo
  is local-only until you provide a repo URL + token or push it yourself.

**Done**
- Full schema migration (`supabase/migrations/0001_init_schema.sql`) — 28 tables
  from the Database Design Document, plus `app_users` to link Supabase auth to
  tenant/company/role.
- Row Level Security (`0002_rls_policies.sql`) enforcing the BRD rule *"one
  company cannot access another company's data"* at the database layer.
- Baseline roles + Phase 1 permission matrix (`supabase/seed.sql`).
- Auth: login page + middleware-protected dashboard shell.
- **Module 1 (Company Management)** end-to-end: list + create company, PAN
  format validation, duplicate-PAN restriction, audit log entry — matching
  the SRS acceptance criteria for this module.
- **Organization setup** (branches, departments, designations) — required
  reference data for Employee Management.
- **Module 2 (Employee Management)** end-to-end: employee master with
  identity/assignment/compliance/bank sections, unique employee-code check,
  PAN format check, Aadhaar Verhoeff checksum validation, IFSC format check,
  audit log entry, and trigram-indexed search by name/code/PAN
  (`0003_search_indexes.sql`) to satisfy the "searchable within 2 seconds"
  acceptance criterion.
- **Modules 3–4 (Salary Structure Designer + Formula Engine)**: salary
  component master, structures with versioned formula lines, and a real
  formula engine (`lib/formula-engine`) — tokenizer → parser → dependency
  resolver → evaluator. Supports `Min`/`Max`/`Round`/`Abs`, percentage
  literals (`12%`), and cross-component references (e.g.
  `PF = Min(Basic,15000) × 12%`). Detects circular dependencies and unknown
  references at validation time — no developer needed to change a formula.
  A live "test calculation" panel on the structure page runs the real
  engine against a sample Gross figure.
- **Module 5 (Attendance & Leave)**: manual attendance marking (upsert by
  employee + date), bulk Excel/CSV import (`lib/attendance/import-parser.ts`,
  SheetJS) with per-row error reporting, leave types + leave applications
  with approve/reject, and an **automatic LOP calculator**
  (`lib/attendance/lop-calculator.ts`) — working days minus present days,
  half-day credit, and approved leave, computed live per employee per
  month. Holiday-calendar and sandwich-leave rules aren't built yet (every
  non-weekly-off day currently counts as a working day).
- Dashboard shell with nav for all Phase 1 modules (remaining pages are
  stubs until built).

**Not started yet** — Payroll Processing, PF/ESI/PT/LWF/TDS, Payslip, ESS,
F&F, then Phases 2–4 per the Implementation Package.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase project URL + keys
npm run dev
```

## Database setup (Supabase)

```bash
supabase link --project-ref <your-project-ref>
supabase db push                 # applies migrations/0001 and 0002
psql <connection-string> -f supabase/seed.sql   # baseline roles
```

A user only sees data once they have a row in `app_users` linking their
`auth.users.id` to a `tenant_id` (and optionally a `company_id` — leave that
null for tenant/super-admin access across all companies).

## Roadmap (per Implementation Package)

| Phase | Scope |
|---|---|
| 1 (current) | Company, Employee, Salary Structure, Formula Engine, Attendance, Leave, Payroll, PF, ESI, PT, LWF, TDS, Payslip, ESS, F&F |
| 2 | Variable Pay, Performance, Reimbursement, Loans, Salary Revision, Retro Payroll, Workflow Engine |
| 3 | Accounting Integration, Compliance Dashboard, Bonus, Gratuity, Insurance |
| 4 | SaaS Billing, White Labelling, Mobile App, AI Analytics |

Target final system: 100+ tables, 150+ APIs, 60+ reports, 50+ screens,
30+ workflows.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import into Vercel, set the three Supabase env vars from `.env.example`.
3. Vercel builds with `next build` — no extra config needed.

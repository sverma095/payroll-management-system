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
- GitHub: **[sverma095/payroll-management-system](https://github.com/sverma095/payroll-management-system)** — pushed and up to date.
- Supabase project **`payroll-management-system`** created (region `ap-south-1`,
  ref `pmssjdauwuutwuxrhqmz`) — all 5 migrations + seed applied, security
  advisor clean except the 3 expected `authenticated`-role warnings on the
  RLS helper functions (required for row-level security to evaluate; see
  `0004_security_hardening.sql` for what was already locked down).
- Vercel: **not connected yet** — the Vercel MCP connector available here
  only supports monitoring existing projects (deployments, logs, docs
  search), not creating one or running `vercel deploy`, and my sandbox's
  network doesn't reach vercel.com. One-time manual step needed:
  1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → `sverma095/payroll-management-system`
  2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL=https://pmssjdauwuutwuxrhqmz.supabase.co`
     and `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_puVSHuv3RyyYgpaoq7kPWw_M7Pa3Oof`
     (both are public/publishable-safe values)
  3. Deploy — every push to `main` redeploys automatically after that.

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
- **Module 6 (Payroll Processing)**: the formula engine now supports
  comparisons (`>`,`<`,`>=`,`<=`,`==`,`!=`) and `IF()`, so slab-based
  components (PT, custom TDS) can be defined entirely in the Salary
  Structure UI — no developer needed. Added the schema piece the original
  design doc was missing: `employee_salary_assignments` (links an employee
  to a structure + monthly CTC — payroll has no input without this).
  `lib/payroll/process.ts` runs the whole pipeline: validates PAN/bank/UAN/
  duplicate-UAN, prorates gross by attendance LOP, runs the formula engine
  per employee, pulls PF/ESI/PT/LWF from whichever components the company
  defined (0 if undefined, not a guessed number), falls back to an
  estimated TDS (`lib/payroll/tds-estimator.ts`, new-regime FY 2025-26
  slabs, clearly flagged as an estimate) only if no TDS component exists.
  Draft → Processed → Approved → Locked status flow, bank-transfer-register
  CSV export, and a payslip view per employee. Not yet exercised against
  real seeded data end-to-end (needs a signed-up user + test company to do
  that through the UI) — verified via unit tests on the pure calculation
  functions and a clean type-check/build.
- Dashboard shell with nav for all Phase 1 modules (remaining pages are
  stubs until built).

**Not started yet** — PF/ESI/PT/LWF/TDS as dedicated *reporting* modules
(challans, ECR, Form 16 — Module 6 already does the calculation side),
Employee Self-Service, Full & Final Settlement, then Phases 2–4 per the
Implementation Package.

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

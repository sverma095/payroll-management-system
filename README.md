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
- Vercel: **live** at https://payroll-management-system-zeta.vercel.app,
  auto-deploying from `main` on every push. Functions pinned to `bom1`
  (Mumbai) to co-locate with the Supabase database.

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
  CSV export, and a payslip view per employee. Verified end-to-end against
  seeded demo data, not just unit tests (see Demo account below).
- **Module 12 (Full & Final Settlement)**: `lib/payroll/full-and-final.ts`
  computes gratuity per the Payment of Gratuity Act (15 days' Basic per
  completed year, service of 6+ months rounds up, 5-year eligibility
  threshold), leave encashment (HR-entered unused days × Basic/26 — no
  running leave-balance ledger exists yet to derive this automatically),
  prorated final-month salary, and nets out any outstanding loan balance +
  notice-pay recovery. Initiating a settlement marks the employee
  `relieved`; approving marks them `ff_completed`. Verified against two
  hand-checked cases (5+ years tenure with gratuity, <5 years without).
- **Reports**: Payroll Register, PF, ESI, PT, LWF, TDS, Headcount, Audit
  Log — shared builder functions between the on-screen table and CSV
  export so they can't drift apart. PF/ESI reports are explicitly labeled
  "indicative — verify against the current EPFO/ESIC spec" rather than
  presented as filing-ready.
- **Employee Self-Service**: three-tier access (tenant admin / company
  admin / employee), own-record-only RLS. Found and fixed a real
  `companies`↔`employees` RLS recursion bug during testing (routed through
  a security-definer function, same pattern as the existing tenant/company
  helpers). `/ess/profile`, `/ess/payslips`, `/ess/leave`.
- **Fixed two real production bugs**: (1) the auth middleware was dropping
  refreshed Supabase session cookies on redirect responses, causing a login
  redirect loop — a documented Next.js + Supabase SSR gotcha, now fixed by
  copying cookies onto every response path. (2) payslips/reports/F&F all
  read a `breakdown_json.values` shape that was never actually written
  (the real shape is `breakdown_json.components`) — consolidated into
  `lib/payroll/breakdown.ts` as the one place that reads it.
- **Performance**: Vercel functions pinned to Mumbai (`bom1`), co-located
  with Supabase (`ap-south-1`), and `resolveCompanyId` collapsed from 3
  sequential round trips into 1 RPC call (`resolve_current_company`) —
  together these fixed a "every page load is slow" complaint.

## Phase 2

- **Loans, Reimbursements, Variable Pay, Performance Ratings** — wired
  into `lib/payroll/process.ts` so they're not data islands: active loan
  EMI is deducted automatically every payroll run (capped at whatever's
  left outstanding, with `loans.outstanding_balance` decremented after a
  successful run), approved-but-unpaid variable pay and reimbursement
  claims are paid out and marked paid the next time payroll runs for that
  employee. Reimbursements has an ESS submission flow too
  (`/ess/reimbursements`); Loans/Variable Pay/Performance are currently
  admin-managed only.
- Not yet built: **Salary Revision** (the mechanism already exists —
  `employee_salary_assignments` supports dated revisions via the existing
  "assign structure" form — just needs a dedicated UI/history view),
  **Retro Payroll** (arrears when a revision lands after payroll already
  ran for that period), and a generalized **Workflow Engine** (today's
  approve/reject patterns are per-module, not a configurable multi-step
  chain using the existing `workflows`/`workflow_steps` tables).

## Demo accounts

Admin (tenant-wide):
```
demo@payroll-os.local / Demo@12345
```
ESS (scoped to one employee, Aarav Sharma):
```
aarav.sharma@demo-industries.local / Employee@123
```

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
| 1 — done | Company, Employee, Salary Structure, Formula Engine, Attendance, Leave, Payroll, PF, ESI, PT, LWF, TDS, Payslip, ESS, F&F |
| 2 — in progress | Variable Pay, Performance, Reimbursement, Loans, Salary Revision, Retro Payroll, Workflow Engine |
| 3 | Accounting Integration, Compliance Dashboard, Bonus, Gratuity, Insurance |
| 4 | SaaS Billing, White Labelling, Mobile App, AI Analytics |

Target final system: 100+ tables, 150+ APIs, 60+ reports, 50+ screens,
30+ workflows.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import into Vercel, set the three Supabase env vars from `.env.example`.
3. Vercel builds with `next build` — no extra config needed.

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { createBranch, createDepartment, createDesignation } from "./actions";
import { Alert } from "@/components/alert";

export default async function OrganizationPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [branches, departments, designations] = companyId
    ? await Promise.all([
        supabase.from("branches").select("id, branch_name, city, state, status").eq("company_id", companyId).order("created_at"),
        supabase.from("departments").select("id, department_name, department_code, status").eq("company_id", companyId).order("created_at"),
        supabase.from("designations").select("id, designation_name, designation_code, grade, status").eq("company_id", companyId).order("created_at")
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Organization</h1>
      <p className="text-sm text-ink/50 mb-6">
        Branches, departments and designations. Employees are assigned to
        these when they&apos;re onboarded.
      </p>

      {searchParams?.error && (
        <Alert>{searchParams.error}</Alert>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Branches */}
        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Branches</h2>
          <ul className="space-y-1.5 mb-4 text-sm">
            {branches.data?.length ? (
              branches.data.map((b: any) => (
                <li key={b.id} className="flex justify-between text-ink/70">
                  <span>{b.branch_name}</span>
                  <span className="text-ink/40">{b.city}, {b.state}</span>
                </li>
              ))
            ) : (
              <li className="text-ink/40">No branches yet.</li>
            )}
          </ul>
          <form action={createBranch} className="space-y-2 border-t border-line pt-3">
            <input name="branch_name" required placeholder="Branch name" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <input name="city" required placeholder="City" className="rounded-lg border border-line px-2.5 py-1.5 text-xs" />
              <input name="state" required placeholder="State" className="rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <div className="flex gap-3 text-xs text-ink/60">
              <label className="flex items-center gap-1"><input type="checkbox" name="pt_applicable" /> PT applicable</label>
              <label className="flex items-center gap-1"><input type="checkbox" name="lwf_applicable" /> LWF applicable</label>
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Add branch
            </button>
          </form>
        </section>

        {/* Departments */}
        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Departments</h2>
          <ul className="space-y-1.5 mb-4 text-sm">
            {departments.data?.length ? (
              departments.data.map((d: any) => (
                <li key={d.id} className="flex justify-between text-ink/70">
                  <span>{d.department_name}</span>
                  <span className="font-mono text-ink/40">{d.department_code}</span>
                </li>
              ))
            ) : (
              <li className="text-ink/40">No departments yet.</li>
            )}
          </ul>
          <form action={createDepartment} className="space-y-2 border-t border-line pt-3">
            <input name="department_name" required placeholder="Department name" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="department_code" required placeholder="Code (e.g. ENG)" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs font-mono uppercase" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Add department
            </button>
          </form>
        </section>

        {/* Designations */}
        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Designations</h2>
          <ul className="space-y-1.5 mb-4 text-sm">
            {designations.data?.length ? (
              designations.data.map((d: any) => (
                <li key={d.id} className="flex justify-between text-ink/70">
                  <span>{d.designation_name}</span>
                  <span className="font-mono text-ink/40">{d.designation_code}</span>
                </li>
              ))
            ) : (
              <li className="text-ink/40">No designations yet.</li>
            )}
          </ul>
          <form action={createDesignation} className="space-y-2 border-t border-line pt-3">
            <input name="designation_name" required placeholder="Designation name" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <input name="designation_code" required placeholder="Code" className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-mono uppercase" />
              <input name="grade" placeholder="Grade" className="rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Add designation
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { addStructureLine, assignSalaryStructure } from "../actions";
import { StructureCalculator } from "@/components/structure-calculator";
import { notFound } from "next/navigation";

export default async function StructureDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: structure } = await supabase
    .from("salary_structures")
    .select("id, structure_name, effective_from, effective_to, status")
    .eq("id", params.id)
    .single();

  if (!structure) notFound();

  const [{ data: lines }, { data: components }, { data: employees }, { data: assignments }] = await Promise.all([
    supabase
      .from("salary_structure_details")
      .select("id, formula, sequence, effective_from, salary_components(component_code, component_name)")
      .eq("salary_structure_id", params.id)
      .order("sequence"),
    companyId
      ? supabase.from("salary_components").select("id, component_code, component_name").eq("company_id", companyId).eq("active", true)
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase.from("employees").select("id, employee_code, first_name, last_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from("employee_salary_assignments")
      .select("employee_id, monthly_gross, effective_from, employees(employee_code, first_name, last_name)")
      .eq("salary_structure_id", params.id)
      .is("effective_to", null)
  ]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">{structure.structure_name}</h1>
      <p className="text-sm text-ink/50 mb-6">
        Effective {structure.effective_from}
        {structure.effective_to ? ` – ${structure.effective_to}` : " onward"}
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-5">
          <section className="bg-white border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink/50">
                  <th className="px-4 py-2.5 font-medium">Component</th>
                  <th className="px-4 py-2.5 font-medium">Formula</th>
                  <th className="px-4 py-2.5 font-medium">Seq</th>
                </tr>
              </thead>
              <tbody>
                {lines && lines.length > 0 ? (
                  lines.map((l: any) => (
                    <tr key={l.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 font-mono text-ink/70">{l.salary_components?.component_code}</td>
                      <td className="px-4 py-2.5 font-mono text-ink">{l.formula}</td>
                      <td className="px-4 py-2.5 text-ink/50">{l.sequence}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-ink/40">
                      No formula lines yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="bg-white border border-line rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink mb-3">Add formula line</h2>
            <form action={addStructureLine} className="space-y-3">
              <input type="hidden" name="structure_id" value={structure.id} />
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Component</label>
                <select name="component_id" required className="w-full rounded-lg border border-line px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
                  <option value="">—</option>
                  {(components ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.component_name} ({c.component_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Formula</label>
                <input
                  name="formula"
                  required
                  placeholder="Gross × 50%  or  Min(Basic,15000) × 12%"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1.5">Sequence</label>
                  <input name="sequence" type="number" defaultValue={(lines?.length ?? 0) + 1} className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1.5">Effective from</label>
                  <input name="effective_from" type="date" required defaultValue={structure.effective_from} className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
                </div>
              </div>

              {searchParams?.error && <p className="text-sm text-warn">{searchParams.error}</p>}

              <button type="submit" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors">
                Add line
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-5">
          <section className="bg-white border border-line rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink mb-1">Assigned employees</h2>
            <p className="text-xs text-ink/50 mb-3">
              This is the gross fed into the formula engine each payroll run.
            </p>
            <ul className="space-y-1.5 mb-4 text-sm">
              {assignments && assignments.length > 0 ? (
                assignments.map((a: any) => (
                  <li key={a.employee_id} className="flex justify-between text-ink/70">
                    <span>
                      {a.employees?.employee_code} — {a.employees?.first_name} {a.employees?.last_name ?? ""}
                    </span>
                    <span className="font-mono">₹{Number(a.monthly_gross).toLocaleString("en-IN")}</span>
                  </li>
                ))
              ) : (
                <li className="text-ink/40">No employees assigned yet.</li>
              )}
            </ul>
            <form action={assignSalaryStructure} className="space-y-2 border-t border-line pt-3">
              <input type="hidden" name="structure_id" value={structure.id} />
              <select name="employee_id" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
                <option value="">Employee</option>
                {(employees ?? []).map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.employee_code} — {e.first_name} {e.last_name ?? ""}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input name="monthly_gross" type="number" required placeholder="Monthly gross" className="rounded-lg border border-line px-2.5 py-1.5 text-xs" />
                <input name="effective_from" type="date" required defaultValue={structure.effective_from} className="rounded-lg border border-line px-2.5 py-1.5 text-xs" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
                Assign
              </button>
            </form>
          </section>

          <StructureCalculator structureId={structure.id} />
        </div>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

const TYPE_LABEL: Record<string, string> = {
  earning: "Earning",
  deduction: "Deduction",
  employer_contribution: "Employer contribution"
};

export default async function SalaryComponentsPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: components } = companyId
    ? await supabase
        .from("salary_components")
        .select("id, component_name, component_code, component_type, taxable, pf_applicable, esi_applicable, active")
        .eq("company_id", companyId)
        .order("created_at")
    : { data: [] };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Salary components</h1>
          <p className="text-sm text-ink/50 mt-1">
            The building blocks referenced by formulas in your salary structures.
          </p>
        </div>
        <Link
          href="/salary-components/new"
          className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors"
        >
          Add component
        </Link>
      </div>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="px-5 py-3 font-medium font-mono">Code</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Taxable</th>
              <th className="px-5 py-3 font-medium">PF</th>
              <th className="px-5 py-3 font-medium">ESI</th>
            </tr>
          </thead>
          <tbody>
            {components && components.length > 0 ? (
              components.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-mono text-ink/70">{c.component_code}</td>
                  <td className="px-5 py-3 text-ink">{c.component_name}</td>
                  <td className="px-5 py-3 text-ink/70">{TYPE_LABEL[c.component_type] ?? c.component_type}</td>
                  <td className="px-5 py-3 text-ink/50">{c.taxable ? "Yes" : "No"}</td>
                  <td className="px-5 py-3 text-ink/50">{c.pf_applicable ? "Yes" : "No"}</td>
                  <td className="px-5 py-3 text-ink/50">{c.esi_applicable ? "Yes" : "No"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-0 py-2"><EmptyState message="No components yet. Start with Basic, HRA and PF." /></td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

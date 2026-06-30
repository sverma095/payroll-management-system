import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export default async function SalaryStructurePage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: structures } = companyId
    ? await supabase
        .from("salary_structures")
        .select("id, structure_name, effective_from, effective_to, status")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Salary structures</h1>
          <p className="text-sm text-ink/50 mt-1">
            Configurable component formulas. Unlimited components per structure.
          </p>
        </div>
        <Link
          href="/salary-structure/new"
          className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors"
        >
          New structure
        </Link>
      </div>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Effective from</th>
              <th className="px-5 py-3 font-medium">Effective to</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {structures && structures.length > 0 ? (
              structures.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <Link href={`/salary-structure/${s.id}`} className="text-accent hover:underline">
                      {s.structure_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink/70">{s.effective_from}</td>
                  <td className="px-5 py-3 text-ink/70">{s.effective_to ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-accentSoft text-accent capitalize">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-0 py-2"><EmptyState message="No salary structures yet." /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

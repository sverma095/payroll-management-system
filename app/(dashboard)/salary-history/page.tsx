import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";

export default async function SalaryHistoryPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: emps } = companyId
    ? await supabase.from("employees").select("id").eq("company_id", companyId)
    : { data: [] };
  const empIds = (emps ?? []).map((e) => e.id);

  const { data: rows } = empIds.length
    ? await supabase
        .from("employee_salary_assignments")
        .select("monthly_gross, effective_from, effective_to, employees(employee_code, first_name, last_name)")
        .in("employee_id", empIds)
        .order("effective_from", { ascending: false })
    : { data: [] };

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Salary Revision History</h1>
      <p className="text-sm text-ink/50 mb-6">Every CTC change, including superseded ones.</p>
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-ink/50">
            <th className="px-4 py-2.5 font-medium">Employee</th>
            <th className="px-4 py-2.5 font-medium text-right">Monthly gross</th>
            <th className="px-4 py-2.5 font-medium">Effective from</th>
            <th className="px-4 py-2.5 font-medium">Effective to</th>
          </tr></thead>
          <tbody>
            {rows && rows.length > 0 ? rows.map((r: any, i: number) => (
              <tr key={i} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink">{r.employees?.employee_code} — {r.employees?.first_name} {r.employees?.last_name ?? ""}</td>
                <td className="px-4 py-2.5 text-right font-mono">{Number(r.monthly_gross).toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 text-ink/70">{formatDate(r.effective_from)}</td>
                <td className="px-4 py-2.5 text-ink/70">{r.effective_to ?? <span className="text-accent">current</span>}</td>
              </tr>
            )) : <tr><td colSpan={4} className="px-0 py-2"><EmptyState message="No salary history yet." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

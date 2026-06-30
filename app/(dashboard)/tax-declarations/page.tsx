import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { EmptyState } from "@/components/empty-state";

export default async function TaxDeclarationsAdminPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const { data: rows } = companyId
    ? await supabase.from("tax_declarations").select("financial_year, regime, declared_amount, status, employees!inner(employee_code, first_name, last_name, company_id)").eq("employees.company_id", companyId)
    : { data: [] };

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Tax Declarations</h1>
      <p className="text-sm text-ink/50 mb-6">Regime choice + declared deductions feed the TDS estimate when no custom TDS formula component exists.</p>
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm"><tbody>
          {rows && rows.length > 0 ? rows.map((r: any, i: number) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="px-4 py-2.5 text-ink">{r.employees?.employee_code} — {r.employees?.first_name} {r.employees?.last_name ?? ""}</td>
              <td className="px-4 py-2.5 text-ink/70">{r.financial_year}</td>
              <td className="px-4 py-2.5 text-ink/70 capitalize">{r.regime}</td>
              <td className="px-4 py-2.5 text-right font-mono">{Number(r.declared_amount).toLocaleString("en-IN")}</td>
              <td className="px-4 py-2.5 text-ink/50">{r.status}</td>
            </tr>
          )) : <tr><td colSpan={5} className="px-0 py-2"><EmptyState message="No declarations yet." /></td></tr>}
        </tbody></table>
      </div>
    </div>
  );
}

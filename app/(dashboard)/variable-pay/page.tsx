import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { allocateVariablePay, approveVariablePay } from "./actions";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/alert";

export default async function VariablePayPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [{ data: rows }, { data: employees }] = await Promise.all([
    companyId
      ? supabase
          .from("variable_pay")
          .select("id, variable_type, allocated_amount, approved_amount, payout_amount, employees!inner(employee_code, first_name, last_name, company_id)")
          .eq("employees.company_id", companyId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase.from("employees").select("id, employee_code, first_name, last_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] })
  ]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Variable Pay</h1>
      <p className="text-sm text-ink/50 mb-6">
        Approved-but-unpaid amounts are paid out automatically the next time payroll runs for that employee.
      </p>
      {searchParams?.error && <Alert>{searchParams.error}</Alert>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium">Employee</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium text-right">Allocated</th>
                <th className="px-4 py-2.5 font-medium text-right">Approved</th>
                <th className="px-4 py-2.5 font-medium text-right">Paid</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows && rows.length > 0 ? (
                rows.map((r: any) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">
                      {r.employees?.employee_code} — {r.employees?.first_name} {r.employees?.last_name ?? ""}
                    </td>
                    <td className="px-4 py-2.5 text-ink/70 capitalize">{r.variable_type}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(r.allocated_amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(r.approved_amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/50">{Number(r.payout_amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5">
                      {Number(r.approved_amount) === 0 && (
                        <form action={approveVariablePay} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="number" name="approved_amount" defaultValue={r.allocated_amount} className="w-20 rounded border border-line px-1.5 py-0.5 text-xs" />
                          <button className="text-xs text-accent hover:underline">Approve</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-0 py-2"><EmptyState message="No variable pay entries yet." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Allocate</h2>
          <form action={allocateVariablePay} className="space-y-3">
            <select name="employee_id" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="">Employee</option>
              {(employees ?? []).map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.employee_code} — {e.first_name} {e.last_name ?? ""}
                </option>
              ))}
            </select>
            <select name="variable_type" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="">Type</option>
              <option value="rating_based">Rating based</option>
              <option value="target_based">Target based</option>
              <option value="kpi_based">KPI based</option>
              <option value="retention_bonus">Retention bonus</option>
              <option value="sales_incentive">Sales incentive</option>
            </select>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Allocated amount</label>
              <input name="allocated_amount" type="number" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Allocate
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

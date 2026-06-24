import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { issueLoan, recordManualRepayment } from "./actions";

export default async function LoansPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [{ data: loans }, { data: employees }] = await Promise.all([
    companyId
      ? supabase
          .from("loans")
          .select("id, loan_amount, interest_rate, emi_amount, outstanding_balance, status, employees!inner(employee_code, first_name, last_name, company_id)")
          .eq("employees.company_id", companyId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase.from("employees").select("id, employee_code, first_name, last_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] })
  ]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Loans</h1>
      <p className="text-sm text-ink/50 mb-6">
        EMI is deducted automatically each time payroll runs while a loan is active. Outstanding balance also feeds Full &amp; Final recoveries.
      </p>

      {searchParams?.error && <p className="text-sm text-warn mb-4">{searchParams.error}</p>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium">Employee</th>
                <th className="px-4 py-2.5 font-medium text-right">Loan</th>
                <th className="px-4 py-2.5 font-medium text-right">EMI</th>
                <th className="px-4 py-2.5 font-medium text-right">Outstanding</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loans && loans.length > 0 ? (
                loans.map((l: any) => (
                  <tr key={l.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">
                      {l.employees?.employee_code} — {l.employees?.first_name} {l.employees?.last_name ?? ""}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(l.loan_amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(l.emi_amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(l.outstanding_balance).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs capitalize ${l.status === "active" ? "bg-accentSoft text-accent" : "bg-ink/5 text-ink/50"}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {l.status === "active" && (
                        <form action={recordManualRepayment} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={l.id} />
                          <input
                            type="number"
                            name="amount"
                            defaultValue={l.emi_amount}
                            className="w-20 rounded border border-line px-1.5 py-0.5 text-xs"
                          />
                          <button className="text-xs text-accent hover:underline">Record</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink/40">No loans yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Issue loan</h2>
          <form action={issueLoan} className="space-y-3">
            <select name="employee_id" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="">Employee</option>
              {(employees ?? []).map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.employee_code} — {e.first_name} {e.last_name ?? ""}
                </option>
              ))}
            </select>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Loan amount</label>
              <input name="loan_amount" type="number" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Interest rate (% p.a.)</label>
              <input name="interest_rate" type="number" step="0.1" defaultValue="0" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Monthly EMI</label>
              <input name="emi_amount" type="number" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Issue loan
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

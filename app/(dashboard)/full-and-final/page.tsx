import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { initiateFullAndFinal, approveFullAndFinal } from "./actions";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-ink/5 text-ink/50",
  approved: "bg-accentSoft text-accent"
};

export default async function FullAndFinalPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [{ data: settlements }, { data: employees }] = await Promise.all([
    companyId
      ? supabase
          .from("full_and_final")
          .select("id, salary_amount, leave_encashment, gratuity, recoveries, notice_pay, net_payable, status, employees(employee_code, first_name, last_name, company_id)")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase
          .from("employees")
          .select("id, employee_code, first_name, last_name")
          .eq("company_id", companyId)
          .in("status", ["active", "notice_period", "probation", "confirmed"])
      : Promise.resolve({ data: [] as any[] })
  ]);

  const companySettlements = (settlements ?? []).filter((s: any) => s.employees?.company_id === companyId);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Full &amp; Final Settlement</h1>
      <p className="text-sm text-ink/50 mb-6">
        Gratuity follows the Payment of Gratuity Act (15 days&apos; basic per
        completed year, 5-year eligibility). Leave encashment uses HR-entered
        unused-leave days — there&apos;s no running leave-balance ledger yet.
      </p>

      {searchParams?.error && <Alert>{searchParams.error}</Alert>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium">Employee</th>
                <th className="px-4 py-2.5 font-medium text-right">Salary</th>
                <th className="px-4 py-2.5 font-medium text-right">Leave</th>
                <th className="px-4 py-2.5 font-medium text-right">Gratuity</th>
                <th className="px-4 py-2.5 font-medium text-right">Recoveries</th>
                <th className="px-4 py-2.5 font-medium text-right">Net payable</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {companySettlements.length > 0 ? (
                companySettlements.map((s: any) => (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">
                      {s.employees?.employee_code} — {s.employees?.first_name} {s.employees?.last_name ?? ""}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(s.salary_amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(s.leave_encashment).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(s.gratuity).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-warn">{Number(s.recoveries) + Number(s.notice_pay)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">{Number(s.net_payable).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_STYLE[s.status] ?? ""}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {s.status === "draft" && (
                        <form action={approveFullAndFinal}>
                          <input type="hidden" name="id" value={s.id} />
                          <button className="text-xs text-accent hover:underline">Approve</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-0 py-2"><EmptyState message="No settlements yet." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Initiate settlement</h2>
          <form action={initiateFullAndFinal} className="space-y-3">
            <select name="employee_id" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="">Employee</option>
              {(employees ?? []).map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.employee_code} — {e.first_name} {e.last_name ?? ""}
                </option>
              ))}
            </select>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Relieving date</label>
              <input name="relieving_date" type="date" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Unused leave (days)</label>
              <input name="unused_leave_days" type="number" step="0.5" defaultValue="0" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Notice pay recovery</label>
              <input name="notice_pay_recovery" type="number" defaultValue="0" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Compute &amp; save
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { addPolicy } from "./actions";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/alert";

export default async function InsurancePage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [{ data: rows }, { data: employees }] = await Promise.all([
    companyId
      ? supabase.from("insurance_policies").select("id, policy_name, policy_number, sum_insured, premium, status, employees!inner(employee_code, first_name, last_name, company_id)").eq("employees.company_id", companyId).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase.from("employees").select("id, employee_code, first_name, last_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] })
  ]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Insurance</h1>
      <p className="text-sm text-ink/50 mb-6">Group/individual policy tracking.</p>
      {searchParams?.error && <Alert>{searchParams.error}</Alert>}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-ink/50">
              <th className="px-4 py-2.5 font-medium">Employee</th>
              <th className="px-4 py-2.5 font-medium">Policy</th>
              <th className="px-4 py-2.5 font-medium text-right">Sum insured</th>
              <th className="px-4 py-2.5 font-medium text-right">Premium</th>
            </tr></thead>
            <tbody>
              {rows && rows.length > 0 ? rows.map((r: any) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-ink">{r.employees?.employee_code} — {r.employees?.first_name} {r.employees?.last_name ?? ""}</td>
                  <td className="px-4 py-2.5 text-ink/70">{r.policy_name}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{Number(r.sum_insured).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{Number(r.premium).toLocaleString("en-IN")}</td>
                </tr>
              )) : <tr><td colSpan={4} className="px-0 py-2"><EmptyState message="No policies yet." /></td></tr>}
            </tbody>
          </table>
          </div>
        </div>
        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Add policy</h2>
          <form action={addPolicy} className="space-y-3">
            <select name="employee_id" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="">Employee</option>
              {(employees ?? []).map((e: any) => <option key={e.id} value={e.id}>{e.employee_code} — {e.first_name}</option>)}
            </select>
            <input name="policy_name" required placeholder="Group Mediclaim" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="policy_number" placeholder="Policy number" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="sum_insured" type="number" required placeholder="Sum insured" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="premium" type="number" defaultValue="0" placeholder="Premium" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">Save</button>
          </form>
        </section>
      </div>
    </div>
  );
}

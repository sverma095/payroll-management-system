import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { addBonus } from "./actions";

export default async function BonusPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [{ data: rows }, { data: employees }] = await Promise.all([
    companyId
      ? supabase.from("bonuses").select("id, financial_year, basic_wages, bonus_percentage, bonus_amount, payout_amount, employees!inner(employee_code, first_name, last_name, company_id)").eq("employees.company_id", companyId).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase.from("employees").select("id, employee_code, first_name, last_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] })
  ]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Bonus</h1>
      <p className="text-sm text-ink/50 mb-6">Payment of Bonus Act: 8.33%–20% of basic wages.</p>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-ink/50">
              <th className="px-4 py-2.5 font-medium">Employee</th>
              <th className="px-4 py-2.5 font-medium">FY</th>
              <th className="px-4 py-2.5 font-medium text-right">%</th>
              <th className="px-4 py-2.5 font-medium text-right">Bonus</th>
            </tr></thead>
            <tbody>
              {rows && rows.length > 0 ? rows.map((r: any) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-ink">{r.employees?.employee_code} — {r.employees?.first_name} {r.employees?.last_name ?? ""}</td>
                  <td className="px-4 py-2.5 text-ink/70">{r.financial_year}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.bonus_percentage}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{Number(r.bonus_amount).toLocaleString("en-IN")}</td>
                </tr>
              )) : <tr><td colSpan={4} className="px-4 py-10 text-center text-ink/40">No bonus entries yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Add bonus</h2>
          <form action={addBonus} className="space-y-3">
            <select name="employee_id" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="">Employee</option>
              {(employees ?? []).map((e: any) => <option key={e.id} value={e.id}>{e.employee_code} — {e.first_name}</option>)}
            </select>
            <input name="financial_year" required placeholder="2025-26" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="basic_wages" type="number" required placeholder="Annual basic wages" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="bonus_percentage" type="number" step="0.01" defaultValue="8.33" min="8.33" max="20" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">Save</button>
          </form>
        </section>
      </div>
    </div>
  );
}

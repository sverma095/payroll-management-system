import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { addPtSlab, deletePtSlab } from "./actions";
import { EmptyState } from "@/components/empty-state";

export default async function PtSlabsPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const { data: slabs } = companyId
    ? await supabase.from("pt_slabs").select("id, state, min_gross, max_gross, pt_amount").eq("company_id", companyId).order("min_gross")
    : { data: [] };
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Professional Tax Slabs</h1>
      <p className="text-sm text-ink/50 mb-6">Enter your state's official slabs — reference for setting up the PT formula in Salary Structure (not auto-applied).</p>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium">State</th>
                <th className="px-4 py-2.5 font-medium">Gross salary range</th>
                <th className="px-4 py-2.5 font-medium text-right">PT amount</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
            {slabs && slabs.length > 0 ? slabs.map((s: any) => (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink">{s.state}</td>
                <td className="px-4 py-2.5 text-ink/70 font-mono">
                  ₹{Number(s.min_gross).toLocaleString("en-IN")}–{s.max_gross ? `₹${Number(s.max_gross).toLocaleString("en-IN")}` : "no limit"}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">₹{Number(s.pt_amount).toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5"><form action={deletePtSlab}><input type="hidden" name="id" value={s.id} /><button className="text-xs text-warn hover:underline">Delete</button></form></td>
              </tr>
            )) : <tr><td colSpan={4} className="px-0 py-2"><EmptyState message="No slabs added yet." /></td></tr>}
          </tbody></table>
        </div>
        <section className="bg-white border border-line rounded-xl p-5">
          <form action={addPtSlab} className="space-y-3">
            <input name="state" required placeholder="State" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="min_gross" type="number" required placeholder="Min gross" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="max_gross" type="number" placeholder="Max gross (blank = no limit)" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="pt_amount" type="number" required placeholder="PT amount" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">Add</button>
          </form>
        </section>
      </div>
    </div>
  );
}

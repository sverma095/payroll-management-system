import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { addPerformanceRating } from "./actions";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/alert";

export default async function PerformancePage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [{ data: ratings }, { data: employees }] = await Promise.all([
    companyId
      ? supabase
          .from("performance_ratings")
          .select("id, review_period, rating, employees!inner(employee_code, first_name, last_name, company_id)")
          .eq("employees.company_id", companyId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase.from("employees").select("id, employee_code, first_name, last_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] })
  ]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Performance Ratings</h1>
      <p className="text-sm text-ink/50 mb-6">Review history feeds informally into Variable Pay decisions.</p>
      {searchParams?.error && <Alert>{searchParams.error}</Alert>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium">Employee</th>
                <th className="px-4 py-2.5 font-medium">Review period</th>
                <th className="px-4 py-2.5 font-medium text-right">Rating</th>
              </tr>
            </thead>
            <tbody>
              {ratings && ratings.length > 0 ? (
                ratings.map((r: any) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">
                      {r.employees?.employee_code} — {r.employees?.first_name} {r.employees?.last_name ?? ""}
                    </td>
                    <td className="px-4 py-2.5 text-ink/70">{r.review_period}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.rating}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-0 py-2"><EmptyState message="No ratings yet." /></td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Add rating</h2>
          <form action={addPerformanceRating} className="space-y-3">
            <select name="employee_id" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="">Employee</option>
              {(employees ?? []).map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.employee_code} — {e.first_name} {e.last_name ?? ""}
                </option>
              ))}
            </select>
            <input name="review_period" required placeholder="H1 FY26" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="rating" type="number" step="0.1" min="1" max="5" required placeholder="Rating (1-5)" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Save
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

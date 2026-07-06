import { createClient } from "@/lib/supabase/server";
import { submitMyClaim } from "./actions";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";

export default async function MyReimbursementsPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();

  const { data: claims } = await supabase
    .from("reimbursements")
    .select("id, claim_type, claim_amount, approved_amount, status")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">My Reimbursements</h1>
      <p className="text-sm text-ink/50 mb-6">Submit an expense claim and track its status.</p>

      {searchParams?.error && <Alert>{searchParams.error}</Alert>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium">Claim type</th>
                <th className="px-4 py-2.5 font-medium text-right">Claimed</th>
                <th className="px-4 py-2.5 font-medium text-right">Approved</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {claims && claims.length > 0 ? (
                claims.map((c: any) => (
                  <tr key={c.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">{c.claim_type}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(c.claim_amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(c.approved_amount ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-0 py-2"><EmptyState message="No claims yet." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Submit a claim</h2>
          <form action={submitMyClaim} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Claim type</label>
              <input name="claim_type" required placeholder="Travel, internet, etc." className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Amount</label>
              <input name="claim_amount" type="number" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Submit claim
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { decideReimbursement } from "./actions";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/alert";

export default async function ReimbursementsPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: claims } = companyId
    ? await supabase
        .from("reimbursements")
        .select("id, claim_type, claim_amount, approved_amount, status, employees!inner(employee_code, first_name, last_name, company_id)")
        .eq("employees.company_id", companyId)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Reimbursements</h1>
      <p className="text-sm text-ink/50 mb-6">
        Employees submit claims from their own portal. Approved-but-unpaid claims are paid out the next time payroll runs.
      </p>
      {searchParams?.error && <Alert>{searchParams.error}</Alert>}

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="px-4 py-2.5 font-medium">Employee</th>
              <th className="px-4 py-2.5 font-medium">Claim type</th>
              <th className="px-4 py-2.5 font-medium text-right">Claimed</th>
              <th className="px-4 py-2.5 font-medium text-right">Approved</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {claims && claims.length > 0 ? (
              claims.map((c: any) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-ink">
                    {c.employees?.employee_code} — {c.employees?.first_name} {c.employees?.last_name ?? ""}
                  </td>
                  <td className="px-4 py-2.5 text-ink/70">{c.claim_type}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{Number(c.claim_amount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{Number(c.approved_amount ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    {c.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <form action={decideReimbursement} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <input type="number" name="approved_amount" defaultValue={c.claim_amount} className="w-20 rounded border border-line px-1.5 py-0.5 text-xs" />
                          <button className="text-xs text-accent hover:underline">Approve</button>
                        </form>
                        <form action={decideReimbursement}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="decision" value="rejected" />
                          <button className="text-xs text-warn hover:underline">Reject</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-0 py-2"><EmptyState message="No claims yet." /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

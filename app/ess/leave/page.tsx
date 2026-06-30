import { createClient } from "@/lib/supabase/server";
import { applyMyLeave } from "./actions";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-accentSoft text-accent",
  approved: "bg-accentSoft text-accent",
  rejected: "bg-warn/10 text-warn",
  cancelled: "bg-ink/5 text-ink/50"
};

export default async function MyLeavePage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();

  const [{ data: applications }, { data: leaveTypes }] = await Promise.all([
    supabase
      .from("leave_applications")
      .select("id, from_date, to_date, status, leave_types(leave_name, leave_code)")
      .order("created_at", { ascending: false }),
    supabase.from("leave_types").select("id, leave_name, leave_code, annual_limit")
  ]);

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const balances = (leaveTypes ?? []).map((t: any) => {
    const taken = (applications ?? [])
      .filter((a: any) => a.leave_types?.leave_code === t.leave_code && a.status === "approved" && a.from_date >= yearStart)
      .reduce((s: number, a: any) => s + (new Date(a.to_date).getTime() - new Date(a.from_date).getTime()) / 86400000 + 1, 0);
    return { ...t, taken, balance: Number(t.annual_limit) - taken };
  });

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">My Leave</h1>
      <p className="text-sm text-ink/50 mb-6">Apply for leave and track the status of your requests.</p>

      {searchParams?.error && <Alert>{searchParams.error}</Alert>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">From</th>
                <th className="px-4 py-2.5 font-medium">To</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications && applications.length > 0 ? (
                applications.map((a: any) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">{a.leave_types?.leave_name}</td>
                    <td className="px-4 py-2.5 text-ink/70">{a.from_date}</td>
                    <td className="px-4 py-2.5 text-ink/70">{a.to_date}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_STYLE[a.status] ?? ""}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-0 py-2"><EmptyState message="No leave applications yet." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Leave balance</h2>
          <ul className="text-xs text-ink/70 space-y-1 mb-4">
            {balances.map((b: any) => <li key={b.id}>{b.leave_code}: {b.balance} / {b.annual_limit}</li>)}
          </ul>
          <h2 className="text-sm font-semibold text-ink mb-3">Apply for leave</h2>
          <form action={applyMyLeave} className="space-y-3">
            <select name="leave_type_id" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="">Leave type</option>
              {(leaveTypes ?? []).map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.leave_code} — {t.leave_name}
                </option>
              ))}
            </select>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">From date</label>
              <input name="from_date" type="date" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">To date</label>
              <input name="to_date" type="date" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Submit
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

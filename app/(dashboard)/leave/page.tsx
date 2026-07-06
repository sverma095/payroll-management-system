import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { createLeaveType, applyLeave, decideLeave } from "./actions";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";

export default async function LeavePage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [{ data: leaveTypes }, { data: employees }, { data: applications }] = await Promise.all([
    companyId
      ? supabase.from("leave_types").select("id, leave_name, leave_code, annual_limit, carry_forward, encashment_allowed").eq("company_id", companyId)
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase.from("employees").select("id, employee_code, first_name, last_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase
          .from("leave_applications")
          .select("id, from_date, to_date, status, employees(employee_code, first_name, last_name), leave_types(leave_name, leave_code)")
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] as any[] })
  ]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Leave</h1>
      <p className="text-sm text-ink/50 mb-6">
        Approved leave feeds directly into the automatic LOP calculation on
        the Attendance page.
      </p>

      {searchParams?.error && <Alert>{searchParams.error}</Alert>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <section className="bg-white border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink/50">
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">From</th>
                  <th className="px-4 py-2.5 font-medium">To</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {applications && applications.length > 0 ? (
                  applications.map((a: any) => (
                    <tr key={a.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-ink">
                        {a.employees?.employee_code} — {a.employees?.first_name} {a.employees?.last_name ?? ""}
                      </td>
                      <td className="px-4 py-2.5 text-ink/70 font-mono">{a.leave_types?.leave_code}</td>
                      <td className="px-4 py-2.5 text-ink/70">{formatDate(a.from_date)}</td>
                      <td className="px-4 py-2.5 text-ink/70">{formatDate(a.to_date)}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        {a.status === "pending" && (
                          <div className="flex gap-2">
                            <form action={decideLeave}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="decision" value="approved" />
                              <button className="text-xs text-accent hover:underline">Approve</button>
                            </form>
                            <form action={decideLeave}>
                              <input type="hidden" name="id" value={a.id} />
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
                    <td colSpan={6} className="px-0 py-2"><EmptyState message="No leave applications yet." /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="bg-white border border-line rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink mb-3">Apply for leave</h2>
            <form action={applyLeave} className="grid grid-cols-4 gap-3 items-end">
              <select name="employee_id" required className="rounded-lg border border-line px-3 py-2 text-sm bg-white">
                <option value="">Employee</option>
                {(employees ?? []).map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.employee_code} — {e.first_name}
                  </option>
                ))}
              </select>
              <select name="leave_type_id" required className="rounded-lg border border-line px-3 py-2 text-sm bg-white">
                <option value="">Leave type</option>
                {(leaveTypes ?? []).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.leave_code} — {t.leave_name}
                  </option>
                ))}
              </select>
              <input name="from_date" type="date" required className="rounded-lg border border-line px-3 py-2 text-sm" />
              <input name="to_date" type="date" required className="rounded-lg border border-line px-3 py-2 text-sm" />
              <div className="col-span-4">
                <button type="submit" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors">
                  Submit application
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Leave types</h2>
          <ul className="space-y-1.5 mb-4 text-sm">
            {leaveTypes && leaveTypes.length > 0 ? (
              leaveTypes.map((t: any) => (
                <li key={t.id} className="flex justify-between text-ink/70">
                  <span>{t.leave_name}</span>
                  <span className="font-mono text-ink/40">{t.leave_code} · {t.annual_limit}/yr</span>
                </li>
              ))
            ) : (
              <li className="text-ink/40">
                No leave types yet. Add CL, SL, EL, Comp Off, LOP.
              </li>
            )}
          </ul>
          <form action={createLeaveType} className="space-y-2 border-t border-line pt-3">
            <input name="leave_name" required placeholder="Leave name" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <input name="leave_code" required placeholder="Code (CL)" className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-mono uppercase" />
              <input name="annual_limit" type="number" placeholder="Annual limit" className="rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            </div>
            <div className="flex gap-3 text-xs text-ink/60">
              <label className="flex items-center gap-1"><input type="checkbox" name="carry_forward" /> Carry forward</label>
              <label className="flex items-center gap-1"><input type="checkbox" name="encashment_allowed" /> Encashable</label>
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">
              Add leave type
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

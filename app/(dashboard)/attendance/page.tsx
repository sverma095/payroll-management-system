import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { fetchMonthlyAttendanceSummary } from "@/lib/attendance/summary";
import { markAttendance } from "./actions";
import Link from "next/link";

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AttendancePage({
  searchParams
}: {
  searchParams: { month?: string; error?: string };
}) {
  const monthParam = searchParams?.month || currentMonthStr();
  const [year, month] = monthParam.split("-").map(Number);

  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [summary, { data: employees }] = await Promise.all([
    companyId ? fetchMonthlyAttendanceSummary(supabase, companyId, year, month) : Promise.resolve([]),
    companyId
      ? supabase.from("employees").select("id, employee_code, first_name, last_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] })
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Attendance</h1>
          <p className="text-sm text-ink/50 mt-1">
            LOP is calculated automatically from working days minus present
            days, half-day credit and approved leave.
          </p>
        </div>
        <Link
          href="/attendance/import"
          className="rounded-lg border border-line bg-white text-sm font-medium px-4 py-2 hover:bg-accentSoft transition-colors"
        >
          Import from Excel/CSV
        </Link>
      </div>

      <form method="get" className="mb-4">
        <input
          type="month"
          name="month"
          defaultValue={monthParam}
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </form>

      {searchParams?.error && <p className="text-sm text-warn mb-4">{searchParams.error}</p>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium font-mono">Code</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium text-right">Present</th>
                <th className="px-4 py-2.5 font-medium text-right">Half day</th>
                <th className="px-4 py-2.5 font-medium text-right">Leave</th>
                <th className="px-4 py-2.5 font-medium text-right">LOP</th>
              </tr>
            </thead>
            <tbody>
              {summary.length > 0 ? (
                summary.map((s) => (
                  <tr key={s.employeeId} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 font-mono text-ink/70">{s.employeeCode}</td>
                    <td className="px-4 py-2.5 text-ink">{s.employeeName}</td>
                    <td className="px-4 py-2.5 text-right text-ink/70">{s.presentDays}</td>
                    <td className="px-4 py-2.5 text-right text-ink/70">{s.halfDays}</td>
                    <td className="px-4 py-2.5 text-right text-ink/70">{s.approvedLeaveDays}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={s.lopDays > 0 ? "text-warn font-medium" : "text-ink/40"}>
                        {s.lopDays}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink/40">
                    No active employees yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Mark attendance</h2>
          <form action={markAttendance} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Employee</label>
              <select name="employee_id" required className="w-full rounded-lg border border-line px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
                <option value="">—</option>
                {(employees ?? []).map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.employee_code} — {e.first_name} {e.last_name ?? ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Date</label>
              <input name="attendance_date" type="date" required defaultValue={`${monthParam}-01`} className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Status</label>
              <select name="status" defaultValue="present" className="w-full rounded-lg border border-line px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half day</option>
                <option value="on_leave">On leave</option>
                <option value="holiday">Holiday</option>
                <option value="week_off">Week off</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Working hours</label>
                <input name="working_hours" type="number" step="0.5" defaultValue="8" className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Overtime hours</label>
                <input name="overtime_hours" type="number" step="0.5" defaultValue="0" className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
              </div>
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-sm font-medium py-2 hover:bg-accent/90 transition-colors">
              Save
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

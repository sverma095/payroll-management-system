import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { CopyButton } from "@/components/copy-button";
import { Avatar } from "@/components/avatar";
import { StatusBadge } from "@/components/status-badge";
import { Toast } from "@/components/toast";
import { UserPlus } from "lucide-react";
import { generateInvite, revokeInvite } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  probation: "Probation",
  confirmed: "Confirmed",
  notice_period: "Notice period",
  relieved: "Relieved",
  ff_completed: "F&F completed",
  archived: "Archived"
};

export default async function EmployeesPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const q = searchParams?.q?.trim() ?? "";

  let query = supabase
    .from("employees")
    .select(
      "id, employee_code, first_name, last_name, pan, status, departments(department_name), designations(designation_name)"
    )
    .eq("company_id", companyId ?? "")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `employee_code.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,pan.ilike.%${q}%`
    );
  }

  const { data: employees } = await query;
  const employeeIds = (employees ?? []).map((e: any) => e.id);

  const [{ data: invites }, { data: essUsers }] = await Promise.all([
    employeeIds.length
      ? supabase.from("invites").select("id, employee_id, code, used").in("employee_id", employeeIds).eq("used", false)
      : Promise.resolve({ data: [] as any[] }),
    employeeIds.length
      ? supabase.from("app_users").select("employee_id").in("employee_id", employeeIds)
      : Promise.resolve({ data: [] as any[] })
  ]);

  const inviteByEmployee = new Map((invites ?? []).map((i: any) => [i.employee_id, i]));
  const essActiveEmployees = new Set((essUsers ?? []).map((u: any) => u.employee_id));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div className="p-8">
      <Toast />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Employees</h1>
          <p className="text-sm text-ink/50 mt-1">
            Employee master, compliance data and payroll profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/employees-csv" className="rounded-lg border border-line bg-white text-sm font-medium px-4 py-2 hover:bg-accentSoft transition-colors">
            Export CSV
          </a>
          <Link
            href="/employees/new"
            className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors"
          >
            Add employee
          </Link>
        </div>
      </div>

      <form className="mb-4" action="/employees">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, employee code or PAN"
          className="w-full max-w-md rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </form>

      <div className="bg-white border border-line rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="px-5 py-3 font-medium font-mono">Code</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Designation</th>
              <th className="px-5 py-3 font-medium font-mono">PAN</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">ESS access</th>
            </tr>
          </thead>
          <tbody>
            {employees && employees.length > 0 ? (
              employees.map((e: any) => (
                <tr key={e.id} className="border-b border-line last:border-0 hover:bg-paper/60 transition-colors">
                  <td className="px-5 py-3 font-mono text-ink/70">{e.employee_code}</td>
                  <td className="px-5 py-3 text-ink">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${e.first_name} ${e.last_name ?? ""}`} />
                      <span>
                        {e.first_name} {e.last_name ?? ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink/70">{e.departments?.department_name ?? "—"}</td>
                  <td className="px-5 py-3 text-ink/70">{e.designations?.designation_name ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-ink/70">{e.pan ?? "—"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={e.status} label={STATUS_LABEL[e.status] ?? e.status} />
                  </td>
                  <td className="px-5 py-3">
                    {essActiveEmployees.has(e.id) ? (
                      <StatusBadge status="active" label="Active" />
                    ) : inviteByEmployee.has(e.id) ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-ink/70">
                          {inviteByEmployee.get(e.id).code}
                        </span>
                        <CopyButton
                          text={`${siteUrl}/signup?code=${inviteByEmployee.get(e.id).code}`}
                        />
                        <form action={revokeInvite}>
                          <input type="hidden" name="invite_id" value={inviteByEmployee.get(e.id).id} />
                          <button type="submit" className="text-xs text-ink/40 hover:text-warn">
                            Revoke
                          </button>
                        </form>
                      </div>
                    ) : (
                      <form action={generateInvite}>
                        <input type="hidden" name="employee_id" value={e.id} />
                        <button
                          type="submit"
                          className="text-xs text-accent hover:underline"
                        >
                          Generate invite
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-2">
                  <EmptyState message={q ? "No employees match that search." : "No employees yet. Add your first employee to get started."} icon={UserPlus} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

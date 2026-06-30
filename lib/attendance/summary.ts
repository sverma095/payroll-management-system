import { SupabaseClient } from "@supabase/supabase-js";
import { getWorkingDaysExcludingHolidays } from "./working-days";
import { computeAttendanceSummary, AttendanceSummary } from "./lop-calculator";

export interface EmployeeAttendanceSummary extends AttendanceSummary {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
}

function daysBetweenInclusive(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000) + 1;
}

export async function fetchMonthlyAttendanceSummary(
  supabase: SupabaseClient,
  companyId: string,
  year: number,
  month: number // 1-12
): Promise<EmployeeAttendanceSummary[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const monthStartStr = monthStart.toISOString().slice(0, 10);
  const monthEndStr = monthEnd.toISOString().slice(0, 10);

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name")
    .eq("company_id", companyId)
    .eq("status", "active");

  if (!employees || employees.length === 0) return [];

  const employeeIds = employees.map((e) => e.id);

  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("employee_id, status")
    .in("employee_id", employeeIds)
    .gte("attendance_date", monthStartStr)
    .lte("attendance_date", monthEndStr);

  const { data: leaveRows } = await supabase
    .from("leave_applications")
    .select("employee_id, from_date, to_date, leave_types(leave_code)")
    .in("employee_id", employeeIds)
    .eq("status", "approved")
    .lte("from_date", monthEndStr)
    .gte("to_date", monthStartStr);

  const workingDays = await getWorkingDaysExcludingHolidays(supabase, companyId, year, month);

  const presentByEmployee = new Map<string, number>();
  const halfByEmployee = new Map<string, number>();
  for (const row of attendanceRows ?? []) {
    if (row.status === "present") {
      presentByEmployee.set(row.employee_id, (presentByEmployee.get(row.employee_id) ?? 0) + 1);
    } else if (row.status === "half_day") {
      halfByEmployee.set(row.employee_id, (halfByEmployee.get(row.employee_id) ?? 0) + 1);
    }
  }

  const approvedLeaveByEmployee = new Map<string, number>();
  for (const row of (leaveRows ?? []) as any[]) {
    // LOP applications represent unpaid leave — they shouldn't offset LOP, they ARE the LOP
    if (row.leave_types?.leave_code === "LOP") continue;

    const from = new Date(Math.max(new Date(row.from_date).getTime(), monthStart.getTime()));
    const to = new Date(Math.min(new Date(row.to_date).getTime(), monthEnd.getTime()));
    const days = Math.max(0, daysBetweenInclusive(from, to));
    approvedLeaveByEmployee.set(row.employee_id, (approvedLeaveByEmployee.get(row.employee_id) ?? 0) + days);
  }

  return employees.map((e) => {
    const summary = computeAttendanceSummary({
      workingDays,
      presentDays: presentByEmployee.get(e.id) ?? 0,
      halfDays: halfByEmployee.get(e.id) ?? 0,
      approvedLeaveDays: approvedLeaveByEmployee.get(e.id) ?? 0
    });
    return {
      ...summary,
      employeeId: e.id,
      employeeCode: e.employee_code,
      employeeName: `${e.first_name} ${e.last_name ?? ""}`.trim()
    };
  });
}

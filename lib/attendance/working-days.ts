/**
 * Counts working days in a calendar month, excluding a configurable weekly
 * off (default Sunday = 0). Holiday-calendar support (SRS "Holiday Rules")
 * is not implemented yet — every non-weekly-off day currently counts as a
 * working day.
 */
export function getWorkingDaysInMonth(
  year: number,
  month: number, // 1-12
  weeklyOffDay: number = 0
): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() !== weeklyOffDay) workingDays++;
  }
  return workingDays;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

import { SupabaseClient } from "@supabase/supabase-js";

export async function getWorkingDaysExcludingHolidays(
  supabase: SupabaseClient,
  companyId: string,
  year: number,
  month: number,
  weeklyOffDay: number = 0
): Promise<number> {
  const base = getWorkingDaysInMonth(year, month, weeklyOffDay);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${getDaysInMonth(year, month)}`;
  const { data } = await supabase
    .from("holidays")
    .select("holiday_date")
    .eq("company_id", companyId)
    .gte("holiday_date", start)
    .lte("holiday_date", end);
  // only subtract holidays that fall on what would otherwise be a working day
  let count = 0;
  for (const h of data ?? []) {
    const d = new Date(h.holiday_date);
    if (d.getDay() !== weeklyOffDay) count++;
  }
  return Math.max(0, base - count);
}

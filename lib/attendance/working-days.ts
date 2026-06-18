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

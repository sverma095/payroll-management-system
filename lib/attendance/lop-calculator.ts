export interface AttendanceTally {
  workingDays: number;
  presentDays: number;
  halfDays: number;
  approvedLeaveDays: number;
}

export interface AttendanceSummary extends AttendanceTally {
  payableDays: number;
  lopDays: number;
}

/**
 * payableDays = full present days + half credit for half-days + approved
 * leave (CL/SL/EL/Comp Off, anything that isn't the LOP leave type itself).
 * lopDays is whatever's left of the month's working days — never negative.
 */
export function computeAttendanceSummary(tally: AttendanceTally): AttendanceSummary {
  const payableDays = tally.presentDays + tally.halfDays * 0.5 + tally.approvedLeaveDays;
  const lopDays = Math.max(0, round2(tally.workingDays - payableDays));
  return { ...tally, payableDays: round2(payableDays), lopDays };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

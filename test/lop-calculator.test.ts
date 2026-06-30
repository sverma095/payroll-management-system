import { computeAttendanceSummary } from "../lib/attendance/lop-calculator";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    console.error(`FAIL ${label}: expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  } else {
    console.log(`ok ${label}`);
  }
}

const r1 = computeAttendanceSummary({ workingDays: 26, presentDays: 22, halfDays: 1, approvedLeaveDays: 2 });
assertEqual(r1.lopDays, 1.5, "lop with half-day and leave");

const r2 = computeAttendanceSummary({ workingDays: 26, presentDays: 30, halfDays: 0, approvedLeaveDays: 0 });
assertEqual(r2.lopDays, 0, "lop never negative");

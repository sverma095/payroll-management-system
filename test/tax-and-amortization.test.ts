import { estimateOldRegimeAnnualTax } from "../lib/tax/old-regime";
import { buildAmortizationSchedule } from "../lib/payroll/amortization";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    console.error(`FAIL ${label}: expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  } else {
    console.log(`ok ${label}`);
  }
}

assertEqual(estimateOldRegimeAnnualTax(500000, 0), 0, "below rebate threshold, no tax");
assertEqual(estimateOldRegimeAnnualTax(1500000, 150000) > 0, true, "high income, deductions applied, tax > 0");

const schedule = buildAmortizationSchedule(100000, 12, 9000);
assertEqual(schedule[schedule.length - 1].balance, 0, "loan fully amortized to zero");
assertEqual(schedule.length, 12, "12 month schedule for this EMI");

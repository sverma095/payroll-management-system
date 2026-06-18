/**
 * Module 12 — Full & Final Settlement.
 *
 * Simplifications, clearly called out rather than silently assumed:
 * - "Salary" component = gross prorated for days worked in the relieving
 *   month (the assumption being regular payroll already covered prior
 *   months). It does not account for any pending LOP adjustments.
 * - Leave encashment uses Basic/26 as the per-day rate — same convention
 *   the Formula Engine examples use for gratuity, so the two stay
 *   consistent with each other. HR supplies the unused-leave-day count;
 *   there's no running leave-balance ledger yet to derive it automatically.
 * - Gratuity follows the Payment of Gratuity Act: 15 days' wages per
 *   completed year of service, rounding service of 6+ months in the final
 *   year up to the next full year, payable only at 5+ years of service.
 */

export interface FnFInput {
  doj: Date;
  relievingDate: Date;
  monthlyGross: number;
  basic: number;
  unusedLeaveDays: number;
  outstandingLoanBalance: number;
  noticePayRecovery: number;
}

export interface FnFResult {
  tenureYears: number;
  gratuityEligible: boolean;
  salaryAmount: number;
  leaveEncashment: number;
  gratuity: number;
  recoveries: number;
  noticePay: number;
  netPayable: number;
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + (to.getDate() >= from.getDate() ? 0 : -1);
}

export function computeFullAndFinal(input: FnFInput): FnFResult {
  const totalMonths = Math.max(0, monthsBetween(input.doj, input.relievingDate));
  const fullYears = Math.floor(totalMonths / 12);
  const remainderMonths = totalMonths % 12;
  const tenureYears = remainderMonths >= 6 ? fullYears + 1 : fullYears;
  const gratuityEligible = totalMonths >= 60;

  const perDayBasic = input.basic / 26;
  const gratuity = gratuityEligible ? Math.round(perDayBasic * 15 * tenureYears) : 0;
  const leaveEncashment = Math.round(perDayBasic * input.unusedLeaveDays);

  const daysInRelievingMonth = new Date(input.relievingDate.getFullYear(), input.relievingDate.getMonth() + 1, 0).getDate();
  const dayOfMonth = input.relievingDate.getDate();
  const salaryAmount = Math.round((input.monthlyGross * dayOfMonth) / daysInRelievingMonth);

  const recoveries = Math.round(input.outstandingLoanBalance);
  const noticePay = Math.round(input.noticePayRecovery);

  const netPayable = salaryAmount + leaveEncashment + gratuity - recoveries - noticePay;

  return { tenureYears, gratuityEligible, salaryAmount, leaveEncashment, gratuity, recoveries, noticePay, netPayable };
}

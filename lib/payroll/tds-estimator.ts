/**
 * Fallback TDS estimate — used only when a company hasn't defined a "TDS"
 * salary component formula of their own (Module 4 lets them do that with
 * IF/comparisons, e.g. their own slab logic).
 *
 * This implements the new tax regime (FY 2025-26): standard deduction
 * ₹75,000, slabs below, full Section 87A rebate up to ₹12,00,000 taxable
 * income (cliff, not marginal relief — a real Income Tax module, Module 10,
 * would handle that and old-regime declarations properly).
 */

const SLABS: { upTo: number; rate: number }[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 }
];

const STANDARD_DEDUCTION = 75000;
const REBATE_THRESHOLD = 1200000;
const CESS_RATE = 0.04;

export function estimateAnnualTax(annualGross: number): number {
  const taxable = Math.max(0, annualGross - STANDARD_DEDUCTION);

  if (taxable <= REBATE_THRESHOLD) return 0;

  let tax = 0;
  let lower = 0;
  for (const slab of SLABS) {
    if (taxable <= lower) break;
    const upper = Math.min(taxable, slab.upTo);
    tax += Math.max(0, upper - lower) * slab.rate;
    lower = slab.upTo;
  }

  return Math.round(tax * (1 + CESS_RATE));
}

export function estimateMonthlyTDS(annualGrossEstimate: number): number {
  return Math.round(estimateAnnualTax(annualGrossEstimate) / 12);
}

// Old regime (FY 2025-26): standard deduction 50,000, slabs below.
// Deductions (80C/80D/HRA exemption etc.) are taken as a single declared
// total — this does not itemize each section.

const OLD_SLABS: { upTo: number; rate: number }[] = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 }
];
const OLD_STANDARD_DEDUCTION = 50000;
const OLD_REBATE_THRESHOLD = 500000; // Section 87A, old regime
const CESS_RATE = 0.04;

export function estimateOldRegimeAnnualTax(annualGross: number, declaredDeductions: number): number {
  const taxable = Math.max(0, annualGross - OLD_STANDARD_DEDUCTION - declaredDeductions);
  if (taxable <= OLD_REBATE_THRESHOLD) return 0;

  let tax = 0;
  let lower = 0;
  for (const slab of OLD_SLABS) {
    if (taxable <= lower) break;
    const upper = Math.min(taxable, slab.upTo);
    tax += Math.max(0, upper - lower) * slab.rate;
    lower = slab.upTo;
  }
  return Math.round(tax * (1 + CESS_RATE));
}

export function estimateOldRegimeMonthlyTDS(annualGrossEstimate: number, declaredDeductions: number): number {
  return Math.round(estimateOldRegimeAnnualTax(annualGrossEstimate, declaredDeductions) / 12);
}

export interface BreakdownComponent {
  code: string;
  name: string;
  type: string;
  value: number;
}

export interface PayrollBreakdown {
  components: BreakdownComponent[];
  payableDays: number;
  workingDays: number;
  proratedGross: number;
  tdsEstimated: boolean;
}

export function getComponentValue(breakdown: PayrollBreakdown | null | undefined, code: string): number {
  const comp = breakdown?.components?.find((c) => c.code?.toUpperCase() === code.toUpperCase());
  return comp?.value ?? 0;
}

export function hasComponent(breakdown: PayrollBreakdown | null | undefined, code: string): boolean {
  return !!breakdown?.components?.some((c) => c.code?.toUpperCase() === code.toUpperCase());
}

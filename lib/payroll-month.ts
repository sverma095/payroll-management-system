import { cookies } from "next/headers";

const COOKIE_NAME = "payroll_month";

/** { year, month } from the cookie, or null if never set. */
export function getPayrollMonthCookie(): { year: number; month: number } | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [y, m] = raw.split("-").map(Number);
  if (!y || !m) return null;
  return { year: y, month: m };
}

/** Resolves year/month with the priority: explicit URL params > cookie > current month. */
export function resolvePeriod(searchParamsYear?: string, searchParamsMonth?: string) {
  if (searchParamsYear && searchParamsMonth) {
    return { year: Number(searchParamsYear), month: Number(searchParamsMonth) };
  }
  const cookieValue = getPayrollMonthCookie();
  if (cookieValue) return cookieValue;
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

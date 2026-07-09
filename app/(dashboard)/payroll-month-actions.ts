"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setPayrollMonthCookie(formData: FormData) {
  const year = String(formData.get("year") ?? "");
  const month = String(formData.get("month") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "/dashboard");

  if (year && month) {
    cookies().set("payroll_month", `${year}-${month}`, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  redirect(redirectTo);
}

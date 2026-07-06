"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addBonus(formData: FormData) {
  const supabase = createClient();
  const basic_wages = Number(formData.get("basic_wages") ?? 0);
  const bonus_percentage = Number(formData.get("bonus_percentage") ?? 8.33);
  const bonus_amount = Math.round((basic_wages * bonus_percentage) / 100);

  const { error } = await supabase.from("bonuses").insert({
    employee_id: String(formData.get("employee_id") ?? ""),
    financial_year: String(formData.get("financial_year") ?? ""),
    basic_wages,
    bonus_percentage,
    bonus_amount
  });

  if (error) {
    redirect(`/bonus?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/bonus");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addPerformanceRating(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("performance_ratings").insert({
    employee_id: String(formData.get("employee_id") ?? ""),
    review_period: String(formData.get("review_period") ?? ""),
    rating: Number(formData.get("rating") ?? 0),
    reviewer: user?.id ?? null
  });

  if (error) {
    redirect(`/performance?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/performance");
}

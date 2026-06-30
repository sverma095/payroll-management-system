"use server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { revalidatePath } from "next/cache";

export async function saveDeclaration(formData: FormData) {
  const supabase = createClient();
  const { employeeId } = await resolveCompanyId(supabase);
  if (!employeeId) return;

  await supabase.from("tax_declarations").upsert(
    {
      employee_id: employeeId,
      financial_year: String(formData.get("financial_year") ?? ""),
      regime: String(formData.get("regime") ?? "new"),
      declared_amount: Number(formData.get("declared_amount") ?? 0),
      status: "submitted"
    },
    { onConflict: "employee_id,financial_year" }
  );
  revalidatePath("/ess/tax-declaration");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { parseAttendanceFile } from "@/lib/attendance/import-parser";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function markAttendance(formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase.from("attendance").upsert(
    {
      employee_id: String(formData.get("employee_id") ?? ""),
      attendance_date: String(formData.get("attendance_date") ?? ""),
      status: String(formData.get("status") ?? "present"),
      shift: String(formData.get("shift") ?? "") || null,
      working_hours: Number(formData.get("working_hours") ?? 0) || 0,
      overtime_hours: Number(formData.get("overtime_hours") ?? 0) || 0
    },
    { onConflict: "employee_id,attendance_date" }
  );

  const month = String(formData.get("attendance_date") ?? "").slice(0, 7);
  if (error) {
    redirect(`/attendance?month=${month}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/attendance");
  redirect(`/attendance?month=${month}`);
}

export async function importAttendance(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect(`/attendance/import?error=${encodeURIComponent("Choose a file first")}`);
  }

  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect(`/attendance/import?error=${encodeURIComponent("Create a company first")}`);
  }

  const buffer = await file!.arrayBuffer();
  const parsedRows = parseAttendanceFile(buffer);

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code")
    .eq("company_id", companyId!);
  const codeToId = new Map((employees ?? []).map((e) => [e.employee_code.toUpperCase(), e.id]));

  const errors: string[] = [];
  const validRecords: Record<string, unknown>[] = [];

  for (const r of parsedRows) {
    if (r.error) {
      errors.push(`Row ${r.row}: ${r.error}`);
      continue;
    }
    const employeeId = codeToId.get(r.data!.employee_code.toUpperCase());
    if (!employeeId) {
      errors.push(`Row ${r.row}: unknown employee_code ${r.data!.employee_code}`);
      continue;
    }
    validRecords.push({
      employee_id: employeeId,
      attendance_date: r.data!.attendance_date,
      status: r.data!.status,
      working_hours: r.data!.working_hours,
      overtime_hours: r.data!.overtime_hours
    });
  }

  if (validRecords.length > 0) {
    const { error } = await supabase
      .from("attendance")
      .upsert(validRecords, { onConflict: "employee_id,attendance_date" });
    if (error) errors.push(`Database error: ${error.message}`);
  }

  const summary = `imported=${validRecords.length}&skipped=${errors.length}&errors=${encodeURIComponent(
    errors.slice(0, 5).join(" | ")
  )}`;
  redirect(`/attendance/import?${summary}`);
}

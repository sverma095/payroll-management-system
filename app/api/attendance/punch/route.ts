import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { NextRequest, NextResponse } from "next/server";

// POST { employee_code, date }
// Intended for biometric device exports or a future mobile check-in app.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  const { data: emp } = await supabase.from("employees").select("id").eq("company_id", companyId).eq("employee_code", String(body.employee_code ?? "").toUpperCase()).maybeSingle();
  if (!emp) return NextResponse.json({ error: "Unknown employee_code" }, { status: 404 });

  const date = String(body.date ?? new Date().toISOString().slice(0, 10));
  await supabase.from("attendance").upsert(
    { employee_id: emp.id, attendance_date: date, status: "present", working_hours: 8, overtime_hours: 0 },
    { onConflict: "employee_id,attendance_date" }
  );

  return NextResponse.json({ ok: true });
}

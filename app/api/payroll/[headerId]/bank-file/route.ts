import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function csvEscape(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { headerId: string } }
) {
  const supabase = createClient();

  const { data: header } = await supabase
    .from("payroll_headers")
    .select("month, year, company_id")
    .eq("id", params.headerId)
    .single();

  if (!header) {
    return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
  }

  const { data: details } = await supabase
    .from("payroll_details")
    .select("net_salary, employees(employee_code, first_name, last_name, employee_banks(bank_name, account_number, ifsc, beneficiary_name, is_primary))")
    .eq("payroll_header_id", params.headerId);

  const rows = (details ?? []) as any[];

  const header_row = ["Employee Code", "Employee Name", "Bank Name", "Account Number", "IFSC", "Beneficiary Name", "Net Salary"];
  const lines = [header_row.map(csvEscape).join(",")];

  for (const r of rows) {
    const bank = (r.employees?.employee_banks ?? []).find((b: any) => b.is_primary) ?? r.employees?.employee_banks?.[0];
    lines.push(
      [
        r.employees?.employee_code,
        `${r.employees?.first_name ?? ""} ${r.employees?.last_name ?? ""}`.trim(),
        bank?.bank_name ?? "",
        bank?.account_number ?? "",
        bank?.ifsc ?? "",
        bank?.beneficiary_name ?? "",
        Number(r.net_salary).toFixed(2)
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = lines.join("\n");
  const filename = `bank-transfer-register-${header.year}-${String(header.month).padStart(2, "0")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

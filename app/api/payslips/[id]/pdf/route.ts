import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: detail } = await supabase
    .from("payroll_details")
    .select("gross_salary, total_deduction, net_salary, breakdown_json, payroll_headers(month, year, company_id), employees(employee_code, first_name, last_name)")
    .eq("id", params.id)
    .single();

  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const header = (detail as any).payroll_headers;
  const employee = (detail as any).employees;
  const { data: company } = header?.company_id
    ? await supabase.from("companies").select("company_name").eq("id", header.company_id).single()
    : { data: null };

  const components = (detail as any).breakdown_json?.components ?? [];

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([400, 550]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 510;
  const draw = (text: string, x: number, size = 10, f = font) => page.drawText(text, { x, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });

  draw(company?.company_name ?? "Company", 30, 14, bold); y -= 18;
  draw(`Payslip - ${header?.month}/${header?.year}`, 30, 10); y -= 16;
  draw(`${employee?.employee_code} - ${employee?.first_name} ${employee?.last_name ?? ""}`, 30, 10); y -= 24;

  draw("Component", 30, 9, bold); draw("Type", 230, 9, bold); draw("Amount", 320, 9, bold); y -= 14;
  for (const c of components) {
    draw(c.name ?? c.code, 30, 9);
    draw(c.type, 230, 9);
    draw(Number(c.value).toLocaleString("en-IN"), 320, 9);
    y -= 14;
  }
  y -= 6;
  draw("Gross", 30, 9, bold); draw(Number(detail.gross_salary).toLocaleString("en-IN"), 320, 9, bold); y -= 14;
  draw("Total deductions", 30, 9, bold); draw(Number(detail.total_deduction).toLocaleString("en-IN"), 320, 9, bold); y -= 20;
  draw("NET PAY", 30, 12, bold); draw(`Rs ${Number(detail.net_salary).toLocaleString("en-IN")}`, 280, 12, bold);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="payslip-${params.id}.pdf"` }
  });
}

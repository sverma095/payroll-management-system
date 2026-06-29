import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export async function PayslipDetail({ id }: { id: string }) {
  const supabase = createClient();

  const { data: detail } = await supabase
    .from("payroll_details")
    .select(
      "id, gross_salary, total_deduction, net_salary, pf, esi, pt, lwf, tds, breakdown_json, employee_id, payroll_headers(month, year, company_id), employees(employee_code, first_name, last_name, designations(designation_name), departments(department_name))"
    )
    .eq("id", id)
    .single();

  if (!detail) notFound();

  const header = (detail as any).payroll_headers;
  const employee = (detail as any).employees;

  const { data: company } = header?.company_id
    ? await supabase.from("companies").select("company_name, legal_name").eq("id", header.company_id).single()
    : { data: null };

  const breakdown = (detail as any).breakdown_json as
    | { components: { code: string; name: string; type: string; value: number }[]; payableDays: number; workingDays: number; tdsEstimated: boolean }
    | undefined;

  const earningRows = (breakdown?.components ?? []).filter((c) => c.type === "earning");
  const deductionRows: { code: string; name: string; value: number }[] = (breakdown?.components ?? []).filter((c) => c.type === "deduction");
  if (breakdown?.tdsEstimated) {
    deductionRows.push({ code: "TDS", name: "TDS (estimated)", value: Number(detail.tds) });
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-xl font-semibold text-ink">Payslip</h1>
        <a href={`/api/payslips/${id}/pdf`} className="rounded-lg border border-line bg-white text-sm font-medium px-4 py-2 hover:bg-accentSoft transition-colors mr-2">
          Download PDF
        </a>
        <PrintButton />
      </div>

      <div className="bg-white border border-line rounded-xl p-8">
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-line">
          <div>
            <h2 className="font-semibold text-ink">{company?.company_name ?? "Company"}</h2>
            <p className="text-xs text-ink/50">{company?.legal_name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-ink">
              {header ? `${MONTHS[header.month - 1]} ${header.year}` : ""}
            </p>
            <p className="text-xs text-ink/50">Payslip</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-ink/40 text-xs">Employee</p>
            <p className="text-ink">{employee?.employee_code} — {employee?.first_name} {employee?.last_name ?? ""}</p>
          </div>
          <div>
            <p className="text-ink/40 text-xs">Designation</p>
            <p className="text-ink">{employee?.designations?.designation_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-ink/40 text-xs">Department</p>
            <p className="text-ink">{employee?.departments?.department_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-ink/40 text-xs">Payable days</p>
            <p className="text-ink">
              {breakdown?.payableDays ?? "—"} / {breakdown?.workingDays ?? "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold text-ink/50 uppercase mb-2">Earnings</h3>
            <table className="w-full text-sm">
              <tbody>
                {earningRows.map((r) => (
                  <tr key={r.code} className="border-b border-line">
                    <td className="py-1.5 text-ink/70">{r.name}</td>
                    <td className="py-1.5 text-right font-mono">{r.value.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="py-1.5">Gross</td>
                  <td className="py-1.5 text-right font-mono">{Number(detail.gross_salary).toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-ink/50 uppercase mb-2">Deductions</h3>
            <table className="w-full text-sm">
              <tbody>
                {deductionRows.map((r) => (
                  <tr key={r.code} className="border-b border-line">
                    <td className="py-1.5 text-ink/70">{r.name}</td>
                    <td className="py-1.5 text-right font-mono">{r.value.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="py-1.5">Total deductions</td>
                  <td className="py-1.5 text-right font-mono">{Number(detail.total_deduction).toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-line flex justify-between items-center">
          <span className="font-semibold text-ink">Net pay</span>
          <span className="font-mono text-lg font-semibold text-accent">
            ₹{Number(detail.net_salary).toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}

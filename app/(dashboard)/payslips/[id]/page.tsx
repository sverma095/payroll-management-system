import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default async function PayslipDetailPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: detail } = await supabase
    .from("payroll_details")
    .select(
      "id, gross_salary, total_deduction, net_salary, pf, esi, pt, lwf, tds, breakdown_json, employee_id, payroll_headers(month, year, company_id), employees(employee_code, first_name, last_name, designations(designation_name), departments(department_name))"
    )
    .eq("id", params.id)
    .single();

  if (!detail) notFound();

  const header = (detail as any).payroll_headers;
  const employee = (detail as any).employees;

  const { data: company } = header?.company_id
    ? await supabase.from("companies").select("company_name, legal_name").eq("id", header.company_id).single()
    : { data: null };

  // map component codes back to friendly names + earning/deduction classification
  const { data: components } = header?.company_id
    ? await supabase
        .from("salary_components")
        .select("component_code, component_name, component_type")
        .eq("company_id", header.company_id)
    : { data: [] };
  const componentMeta = new Map((components ?? []).map((c) => [c.component_code.toUpperCase(), c]));

  const values: Record<string, number> = (detail as any).breakdown_json?.values ?? {};
  const earningRows: { code: string; name: string; amount: number }[] = [];
  const deductionRows: { code: string; name: string; amount: number }[] = [];

  for (const [code, amount] of Object.entries(values)) {
    if (code === "GROSS") continue;
    const meta = componentMeta.get(code);
    const name = meta?.component_name ?? code;
    if (meta?.component_type === "deduction") {
      deductionRows.push({ code, name, amount });
    } else if (meta?.component_type === "earning") {
      earningRows.push({ code, name, amount });
    }
  }
  if ((detail as any).breakdown_json?.tdsEstimated) {
    deductionRows.push({ code: "TDS", name: "TDS (estimated)", amount: Number(detail.tds) });
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-xl font-semibold text-ink">Payslip</h1>
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
              {(detail as any).breakdown_json?.payableDays ?? "—"} / {(detail as any).breakdown_json?.workingDays ?? "—"}
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
                    <td className="py-1.5 text-right font-mono">{r.amount.toLocaleString("en-IN")}</td>
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
                    <td className="py-1.5 text-right font-mono">{r.amount.toLocaleString("en-IN")}</td>
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

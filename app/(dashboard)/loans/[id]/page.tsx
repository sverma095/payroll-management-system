import { createClient } from "@/lib/supabase/server";
import { buildAmortizationSchedule } from "@/lib/payroll/amortization";
import { notFound } from "next/navigation";

export default async function LoanDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: loan } = await supabase.from("loans").select("loan_amount, interest_rate, emi_amount, outstanding_balance, employees(employee_code, first_name, last_name)").eq("id", params.id).single();
  if (!loan) notFound();

  const schedule = buildAmortizationSchedule(Number(loan.loan_amount), Number(loan.interest_rate), Number(loan.emi_amount));

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-xl font-semibold text-ink mb-1">Amortization Schedule</h1>
      <p className="text-sm text-ink/50 mb-6">{(loan as any).employees?.employee_code} — Outstanding: ₹{Number(loan.outstanding_balance).toLocaleString("en-IN")}</p>
      <div className="bg-white border border-line rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
        <div className="overflow-x-auto">
        <table className="w-full text-sm"><thead className="sticky top-0 bg-white"><tr className="border-b border-line text-left text-ink/50">
          <th className="px-3 py-2 font-medium">#</th><th className="px-3 py-2 font-medium text-right">Interest</th><th className="px-3 py-2 font-medium text-right">Principal</th><th className="px-3 py-2 font-medium text-right">Balance</th>
        </tr></thead><tbody>
          {schedule.map((r) => (
            <tr key={r.month} className="border-b border-line last:border-0">
              <td className="px-3 py-1.5 text-ink/70">{r.month}</td>
              <td className="px-3 py-1.5 text-right font-mono">{r.interest}</td>
              <td className="px-3 py-1.5 text-right font-mono">{r.principal}</td>
              <td className="px-3 py-1.5 text-right font-mono">{r.balance}</td>
            </tr>
          ))}
        </tbody></table>
        </div>
      </div>
    </div>
  );
}

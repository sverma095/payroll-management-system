import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default async function MyPayslipsPage() {
  const supabase = createClient();

  const { data: details } = await supabase
    .from("payroll_details")
    .select("id, net_salary, payroll_headers(month, year, status)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">My Payslips</h1>
      <p className="text-sm text-ink/50 mb-6">Only your own payslips — nothing else in the company is visible here.</p>

      <div className="bg-white border border-line rounded-xl overflow-hidden max-w-lg">
        <ul>
          {details && details.length > 0 ? (
            details.map((d: any) => (
              <li key={d.id} className="border-b border-line last:border-0">
                <Link
                  href={`/ess/payslips/${d.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accentSoft transition-colors"
                >
                  <span className="text-ink">
                    {d.payroll_headers ? `${MONTHS[d.payroll_headers.month - 1]} ${d.payroll_headers.year}` : "—"}
                  </span>
                  <span className="font-mono text-ink/60">₹{Number(d.net_salary).toLocaleString("en-IN")}</span>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-10 text-center text-ink/40">No payslips yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

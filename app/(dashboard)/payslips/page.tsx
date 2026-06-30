import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default async function PayslipsLandingPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: headers } = companyId
    ? await supabase
        .from("payroll_headers")
        .select("id, month, year, status")
        .eq("company_id", companyId)
        .in("status", ["processed", "approved", "locked"])
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(12)
    : { data: [] };

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Payslips</h1>
      <p className="text-sm text-ink/50 mb-6">
        Pick a payroll period to see its payslips, or jump straight to a
        period from Payroll Processing.
      </p>

      <div className="bg-white border border-line rounded-xl overflow-hidden max-w-lg">
        <ul>
          {headers && headers.length > 0 ? (
            headers.map((h) => (
              <li key={h.id} className="border-b border-line last:border-0">
                <Link
                  href={`/payroll?year=${h.year}&month=${h.month}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accentSoft transition-colors"
                >
                  <span className="text-ink">{MONTHS[h.month - 1]} {h.year}</span>
                  <span className="text-ink/40 capitalize">{h.status}</span>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-2">
              <EmptyState message="No processed payroll runs yet." />
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

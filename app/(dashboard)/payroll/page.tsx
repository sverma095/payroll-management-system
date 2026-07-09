import { resolvePeriod } from "@/lib/payroll-month";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { processPayroll, approvePayroll, lockPayroll, runPrePayrollCheck } from "./actions";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/alert";
import Link from "next/link";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default async function PayrollPage({
  searchParams
}: {
  searchParams: {
    year?: string;
    month?: string;
    error?: string;
    checkCount?: string;
    checkBlocking?: string;
    checkWarnings?: string;
  };
}) {
  const { year, month } = resolvePeriod(searchParams?.year, searchParams?.month);

  const supabase = createClient();
  const { companyId, tenantId } = await resolveCompanyId(supabase);

  const { data: processLog } = tenantId
    ? await supabase
        .from("audit_logs")
        .select("created_at, new_value_json")
        .eq("tenant_id", tenantId)
        .eq("module_name", "payroll_processing")
        .eq("action", "process_payroll")
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const { data: header } = companyId
    ? await supabase.from("payroll_headers").select("*").eq("company_id", companyId).eq("year", year).eq("month", month).maybeSingle()
    : { data: null };

  const { data: details } = header
    ? await supabase
        .from("payroll_details")
        .select("id, gross_salary, total_deduction, net_salary, pf, esi, pt, lwf, tds, breakdown_json, employees(employee_code, first_name, last_name)")
        .eq("payroll_header_id", header.id)
        .order("created_at")
    : { data: [] };

  const totals = (details ?? []).reduce(
    (acc, d: any) => ({
      gross: acc.gross + Number(d.gross_salary),
      pf: acc.pf + Number(d.pf ?? 0),
      esi: acc.esi + Number(d.esi ?? 0),
      pt: acc.pt + Number(d.pt ?? 0),
      lwf: acc.lwf + Number(d.lwf ?? 0),
      tds: acc.tds + Number(d.tds ?? 0),
      net: acc.net + Number(d.net_salary)
    }),
    { gross: 0, pf: 0, esi: 0, pt: 0, lwf: 0, tds: 0, net: 0 }
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Payroll processing</h1>
          <p className="text-sm text-ink/50 mt-1">
            Attendance → leave → formula engine → PF/ESI/PT/LWF/TDS → validation → approval → lock.
          </p>
        </div>
        {header && <StatusBadge status={header.status} />}
      </div>

      <form method="get" className="flex gap-3 mb-4">
        <select name="year" defaultValue={year} className="rounded-lg border border-line px-3 py-2 text-sm bg-white">
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select name="month" defaultValue={month} className="rounded-lg border border-line px-3 py-2 text-sm bg-white">
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-line bg-white text-sm font-medium px-4 py-2 hover:bg-accentSoft transition-colors">
          View period
        </button>
      </form>

      {searchParams?.error && (
        <p className="text-sm text-warn mb-4 max-w-3xl">{searchParams.error}</p>
      )}

      {(() => {
        if (searchParams?.checkCount === undefined) return null;
        let blocking: any[] = [];
        let warnings: any[] = [];
        try {
          blocking = JSON.parse(searchParams.checkBlocking ?? "[]");
          warnings = JSON.parse(searchParams.checkWarnings ?? "[]");
        } catch {
          // malformed query param - treat as no issues rather than crash the page
        }
        const clean = blocking.length === 0 && warnings.length === 0;
        return (
          <div className="mb-6">
            <Alert type={clean ? "success" : blocking.length > 0 ? "error" : "info"}>
              {clean
                ? `Pre-payroll check passed for all ${searchParams.checkCount} active employee(s). Ready to process.`
                : `Checked ${searchParams.checkCount} active employee(s): ${blocking.length} blocking issue(s), ${warnings.length} warning(s).`}
            </Alert>
            {(blocking.length > 0 || warnings.length > 0) && (
              <div className="bg-white border border-line rounded-xl p-4 text-xs space-y-1">
                {blocking.map((i: any, idx: number) => (
                  <p key={`b${idx}`} className="text-critical-text">{i.employeeCode ? `${i.employeeCode}: ` : ""}{i.message}</p>
                ))}
                {warnings.map((i: any, idx: number) => (
                  <p key={`w${idx}`} className="text-caution-text">{i.employeeCode ? `${i.employeeCode}: ` : ""}{i.message}</p>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {!header && (
        <form action={processPayroll} className="bg-white border border-line rounded-xl p-5 mb-6">
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="month" value={month} />
          <p className="text-sm text-ink/60 mb-3">
            No payroll run yet for {MONTHS[month - 1]} {year}.
          </p>
          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors">
              Run payroll
            </button>
          </div>
        </form>
      )}

      <form action={runPrePayrollCheck} className="mb-6">
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="month" value={month} />
        <button
          type="submit"
          className="rounded-lg border border-caution-text/30 bg-caution-soft text-caution-text text-sm font-medium px-4 py-2 hover:brightness-95 transition-all"
        >
          ✦ Run Pre-Payroll Check
        </button>
      </form>

      {header && (
        <>
          <div className="flex gap-3 mb-4">
            {header.status === "processed" && (
              <form action={approvePayroll}>
                <input type="hidden" name="header_id" value={header.id} />
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="month" value={month} />
                <button type="submit" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors">
                  Approve
                </button>
              </form>
            )}
            {header.status === "approved" && (
              <>
                <form action={lockPayroll}>
                  <input type="hidden" name="header_id" value={header.id} />
                  <input type="hidden" name="year" value={year} />
                  <input type="hidden" name="month" value={month} />
                  <button type="submit" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors">
                    Lock
                  </button>
                </form>
                <a href={`/api/payroll/${header.id}/bank-file`} className="rounded-lg border border-line bg-white text-sm font-medium px-4 py-2 hover:bg-accentSoft transition-colors">
                  Download bank file
                </a>
              </>
            )}
            {header.status === "locked" && (
              <a href={`/api/payroll/${header.id}/bank-file`} className="rounded-lg border border-line bg-white text-sm font-medium px-4 py-2 hover:bg-accentSoft transition-colors">
                Download bank file
              </a>
            )}
          </div>

          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink/50">
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium text-right">Gross</th>
                  <th className="px-4 py-2.5 font-medium text-right">PF</th>
                  <th className="px-4 py-2.5 font-medium text-right">ESI</th>
                  <th className="px-4 py-2.5 font-medium text-right">PT</th>
                  <th className="px-4 py-2.5 font-medium text-right">LWF</th>
                  <th className="px-4 py-2.5 font-medium text-right">TDS</th>
                  <th className="px-4 py-2.5 font-medium text-right">Net</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {(details ?? []).map((d: any) => (
                  <tr key={d.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">
                      {d.employees?.employee_code} — {d.employees?.first_name} {d.employees?.last_name ?? ""}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(d.gross_salary).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">{Number(d.pf).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">{Number(d.esi).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">{Number(d.pt).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">{Number(d.lwf).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">
                      {Number(d.tds).toLocaleString("en-IN")}
                      {d.breakdown_json?.tdsEstimated && <span title="Estimated — no TDS formula configured">*</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">{Number(d.net_salary).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/payslips/${d.id}`} className="text-xs text-accent hover:underline">Payslip</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              {details && details.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-line font-medium">
                    <td className="px-4 py-2.5">Total</td>
                    <td className="px-4 py-2.5 text-right font-mono">{totals.gross.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">{totals.pf.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">{totals.esi.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">{totals.pt.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">{totals.lwf.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink/60">{totals.tds.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{totals.net.toLocaleString("en-IN")}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            </div>
          </div>
          <p className="text-xs text-ink/40 mt-2">* TDS estimated using new-regime slabs — define a TDS component formula to override.</p>
        </>
      )}

      {processLog && processLog.length > 0 && (
        <div className="bg-white border border-line rounded-xl overflow-hidden shadow-card mt-8">
          <p className="text-sm font-semibold text-ink px-4 pt-4 pb-2">Last {processLog.length} process log</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink/50">
                  <th className="px-4 py-2.5 font-medium">Payroll</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {processLog.map((row: any, idx: number) => {
                  const v = row.new_value_json ?? {};
                  return (
                    <tr key={idx} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-ink/70">{v.month ? `${MONTHS[v.month - 1]} ${v.year}` : "—"}</td>
                      <td className="px-4 py-2.5 text-ink">
                        {v.description ?? `Processed ${v.processedCount ?? "?"} employee(s).`}
                        <span className="block text-xs text-ink/40">
                          Processed on {new Date(row.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status="completed" label="COMPLETED" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

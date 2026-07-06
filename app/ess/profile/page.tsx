import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  probation: "Probation",
  confirmed: "Confirmed",
  notice_period: "Notice period",
  relieved: "Relieved",
  ff_completed: "F&F completed",
  archived: "Archived"
};

export default async function MyProfilePage() {
  const supabase = createClient();
  const { employeeId } = await resolveCompanyId(supabase);

  const { data: employee } = employeeId
    ? await supabase
        .from("employees")
        .select(
          "employee_code, first_name, last_name, dob, doj, gender, pan, aadhaar, uan, esic_number, status, departments(department_name), designations(designation_name), branches(branch_name)"
        )
        .eq("id", employeeId)
        .single()
    : { data: null };

  const { data: bank } = employeeId
    ? await supabase
        .from("employee_banks")
        .select("bank_name, account_number, ifsc")
        .eq("employee_id", employeeId)
        .eq("is_primary", true)
        .maybeSingle()
    : { data: null };

  if (!employee) {
    return <div className="p-8 text-ink/50">Profile not found.</div>;
  }

  const e = employee as any;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-ink mb-1">
        {e.first_name} {e.last_name ?? ""}
      </h1>
      <p className="text-sm text-ink/50 mb-6">
        {e.designations?.designation_name ?? "—"} · {e.departments?.department_name ?? "—"}
      </p>

      <div className="grid grid-cols-2 gap-5">
        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-xs font-semibold text-ink/50 uppercase mb-3">Employment</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Employee code" value={e.employee_code} mono />
            <Row label="Branch" value={e.branches?.branch_name ?? "—"} />
            <Row label="Date of joining" value={formatDate(e.doj)} />
            <div className="flex justify-between items-center">
              <dt className="text-ink/50">Status</dt>
              <dd><StatusBadge status={e.status} label={STATUS_LABEL[e.status] ?? e.status} /></dd>
            </div>
          </dl>
        </section>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-xs font-semibold text-ink/50 uppercase mb-3">Compliance</h2>
          <dl className="space-y-2 text-sm">
            <Row label="PAN" value={e.pan ?? "—"} mono />
            <Row label="Aadhaar" value={e.aadhaar ?? "—"} mono />
            <Row label="UAN" value={e.uan ?? "—"} mono />
            <Row label="ESIC number" value={e.esic_number ?? "—"} mono />
          </dl>
        </section>

        <section className="bg-white border border-line rounded-xl p-5 col-span-2">
          <h2 className="text-xs font-semibold text-ink/50 uppercase mb-3">Bank account</h2>
          {bank ? (
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <Row label="Bank" value={bank.bank_name} />
              <Row label="Account number" value={bank.account_number} mono />
              <Row label="IFSC" value={bank.ifsc} mono />
            </dl>
          ) : (
            <p className="text-sm text-ink/40">No bank account on file — contact HR.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink/50">{label}</dt>
      <dd className={mono ? "font-mono text-ink" : "text-ink"}>{value}</dd>
    </div>
  );
}

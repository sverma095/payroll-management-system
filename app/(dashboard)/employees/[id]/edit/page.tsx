import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { updateEmployee } from "../../actions";
import { Alert } from "@/components/alert";
import { notFound } from "next/navigation";

const STATUS_OPTIONS = ["draft", "active", "probation", "confirmed", "notice_period", "relieved", "ff_completed", "archived"];

export default async function EditEmployeePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!employee) notFound();

  const [departments, designations, branches, managers] = companyId
    ? await Promise.all([
        supabase.from("departments").select("id, department_name").eq("company_id", companyId).eq("status", "active"),
        supabase.from("designations").select("id, designation_name").eq("company_id", companyId).eq("status", "active"),
        supabase.from("branches").select("id, branch_name").eq("company_id", companyId).eq("status", "active"),
        supabase.from("employees").select("id, employee_code, first_name, last_name").eq("company_id", companyId).neq("id", params.id)
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-semibold text-ink mb-1">
        Edit {employee.first_name} {employee.last_name ?? ""}
      </h1>
      <p className="text-sm text-ink/50 mb-6">
        <span className="font-mono">{employee.employee_code}</span> — employee code can&apos;t be changed here.
      </p>

      <form action={updateEmployee} className="bg-white border border-line rounded-xl p-6 space-y-6">
        <input type="hidden" name="employee_id" value={employee.id} />

        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" name="first_name" required defaultValue={employee.first_name} />
            <Field label="Last name" name="last_name" defaultValue={employee.last_name ?? ""} />
            <Field label="Date of joining" name="doj" type="date" required defaultValue={employee.doj} />
            <Field label="Date of birth" name="dob" type="date" defaultValue={employee.dob ?? ""} />
            <Select label="Gender" name="gender" defaultValue={employee.gender ?? ""} options={["Male", "Female", "Other"]} />
            <Select label="Status" name="status" defaultValue={employee.status} options={STATUS_OPTIONS} required />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Assignment</h2>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              name="department_id"
              defaultValue={employee.department_id ?? ""}
              options={(departments.data ?? []).map((d: any) => ({ value: d.id, label: d.department_name }))}
            />
            <Select
              label="Designation"
              name="designation_id"
              defaultValue={employee.designation_id ?? ""}
              options={(designations.data ?? []).map((d: any) => ({ value: d.id, label: d.designation_name }))}
            />
            <Select
              label="Branch"
              name="branch_id"
              defaultValue={employee.branch_id ?? ""}
              options={(branches.data ?? []).map((b: any) => ({ value: b.id, label: b.branch_name }))}
            />
            <Select
              label="Manager"
              name="manager_id"
              defaultValue={employee.manager_id ?? ""}
              options={(managers.data ?? []).map((m: any) => ({
                value: m.id,
                label: `${m.employee_code} — ${m.first_name} ${m.last_name ?? ""}`
              }))}
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Compliance</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="PAN" name="pan" mono placeholder="ABCDE1234F" defaultValue={employee.pan ?? ""} />
            <Field label="Aadhaar" name="aadhaar" mono defaultValue={employee.aadhaar ?? ""} />
            <Field label="UAN" name="uan" mono defaultValue={employee.uan ?? ""} />
            <Field label="ESIC number" name="esic_number" mono defaultValue={employee.esic_number ?? ""} />
          </div>
        </div>

        {searchParams?.error && <Alert>{searchParams.error}</Alert>}

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  mono,
  placeholder,
  type = "text",
  defaultValue
}: {
  label: string;
  name: string;
  required?: boolean;
  mono?: boolean;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink/70 mb-1.5">
        {label}
        {required && <span className="text-warn"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
          mono ? "font-mono uppercase" : ""
        }`}
      />
    </div>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
  required
}: {
  label: string;
  name: string;
  options: string[] | { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div>
      <label className="block text-xs font-medium text-ink/70 mb-1.5">{label}</label>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white"
      >
        {!required && <option value="">—</option>}
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

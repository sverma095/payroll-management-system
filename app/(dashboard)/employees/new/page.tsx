import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { createEmployee } from "../actions";
import Link from "next/link";

export default async function NewEmployeePage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [departments, designations, branches] = companyId
    ? await Promise.all([
        supabase.from("departments").select("id, department_name").eq("company_id", companyId).eq("status", "active"),
        supabase.from("designations").select("id, designation_name").eq("company_id", companyId).eq("status", "active"),
        supabase.from("branches").select("id, branch_name").eq("company_id", companyId).eq("status", "active")
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const noOrgData = !departments.data?.length && !designations.data?.length && !branches.data?.length;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-semibold text-ink mb-1">Add employee</h1>
      <p className="text-sm text-ink/50 mb-6">
        Employee code must be unique. PAN, Aadhaar, UAN and IFSC are
        validated on save.
      </p>

      {noOrgData && (
        <p className="text-sm text-warn mb-4">
          No departments, designations or branches yet —{" "}
          <Link href="/organization" className="underline">set those up first</Link>{" "}
          (you can still save the employee without them and assign later).
        </p>
      )}

      <form action={createEmployee} className="bg-white border border-line rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee code" name="employee_code" mono required />
            <Field label="Date of joining" name="doj" type="date" required />
            <Field label="First name" name="first_name" required />
            <Field label="Last name" name="last_name" />
            <Field label="Date of birth" name="dob" type="date" />
            <Select label="Gender" name="gender" options={["Male", "Female", "Other"]} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Assignment</h2>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Department"
              name="department_id"
              options={(departments.data ?? []).map((d: any) => ({ value: d.id, label: d.department_name }))}
            />
            <Select
              label="Designation"
              name="designation_id"
              options={(designations.data ?? []).map((d: any) => ({ value: d.id, label: d.designation_name }))}
            />
            <Select
              label="Branch"
              name="branch_id"
              options={(branches.data ?? []).map((b: any) => ({ value: b.id, label: b.branch_name }))}
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Compliance</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="PAN" name="pan" mono placeholder="ABCDE1234F" />
            <Field label="Aadhaar" name="aadhaar" mono placeholder="12-digit number" />
            <Field label="UAN" name="uan" mono placeholder="12-digit number" />
            <Field label="ESIC number" name="esic_number" mono />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Primary bank account</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bank name" name="bank_name" />
            <Field label="Beneficiary name" name="beneficiary_name" />
            <Field label="Account number" name="account_number" mono />
            <Field label="IFSC" name="ifsc" mono placeholder="ABCD0123456" />
          </div>
        </div>

        {searchParams?.error && <p className="text-sm text-warn">{searchParams.error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors"
          >
            Save employee
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
  type = "text"
}: {
  label: string;
  name: string;
  required?: boolean;
  mono?: boolean;
  placeholder?: string;
  type?: string;
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
  options
}: {
  label: string;
  name: string;
  options: string[] | { value: string; label: string }[];
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div>
      <label className="block text-xs font-medium text-ink/70 mb-1.5">{label}</label>
      <select
        name={name}
        className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white"
      >
        <option value="">—</option>
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

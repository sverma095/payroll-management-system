import { createCompany } from "../actions";

export default function NewCompanyPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-ink mb-1">Add company</h1>
      <p className="text-sm text-ink/50 mb-6">
        PAN must be unique. Company creation is logged to the audit trail.
      </p>

      <form
        action={createCompany}
        className="bg-white border border-line rounded-xl p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company name" name="company_name" required />
          <Field label="Legal name" name="legal_name" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="PAN" name="pan" mono placeholder="ABCDE1234F" required />
          <Field label="TAN" name="tan" mono placeholder="ABCD12345E" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="GSTIN" name="gstin" mono placeholder="07ABCDE1234F1Z5" />
          <Field label="CIN" name="cin" mono />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="PF registration number" name="pf_number" mono />
          <Field label="ESI registration number" name="esi_number" mono />
        </div>

        {searchParams?.error && (
          <p className="text-sm text-warn">{searchParams.error}</p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors"
          >
            Save company
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
  placeholder
}: {
  label: string;
  name: string;
  required?: boolean;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink/70 mb-1.5">
        {label}
        {required && <span className="text-warn"> *</span>}
      </label>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
          mono ? "font-mono uppercase" : ""
        }`}
      />
    </div>
  );
}

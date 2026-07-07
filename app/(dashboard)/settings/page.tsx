import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { updateCompany } from "../companies/actions";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: { error?: string; toast?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: company } = companyId
    ? await supabase
        .from("companies")
        .select("id, company_name, legal_name, pan, tan, gstin, cin, pf_number, esi_number")
        .eq("id", companyId)
        .maybeSingle()
    : { data: null };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-ink mb-1">Settings</h1>
      <p className="text-sm text-ink/50 mb-6">Company profile and registration details.</p>
      {searchParams?.error && <Alert>{searchParams.error}</Alert>}
      {searchParams?.toast && <Alert type="success">{searchParams.toast.replace(/\+/g, " ")}</Alert>}

      {!company ? (
        <EmptyState message="No company selected yet. Add a company first." />
      ) : (
        <form action={updateCompany} className="bg-white border border-line rounded-xl p-6 space-y-4 shadow-card">
          <input type="hidden" name="company_id" value={company.id} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company name" name="company_name" defaultValue={company.company_name} required />
            <Field label="Legal name" name="legal_name" defaultValue={company.legal_name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="PAN" name="pan" mono defaultValue={company.pan} required />
            <Field label="TAN" name="tan" mono defaultValue={company.tan ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="GSTIN" name="gstin" mono defaultValue={company.gstin ?? ""} />
            <Field label="CIN" name="cin" mono defaultValue={company.cin ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="PF registration number" name="pf_number" mono defaultValue={company.pf_number ?? ""} />
            <Field label="ESI registration number" name="esi_number" mono defaultValue={company.esi_number ?? ""} />
          </div>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors"
            >
              Save changes
            </button>
            <Link href="/billing" className="text-xs text-ink/40 hover:text-ink/60">
              Branding &amp; subscription →
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  required,
  mono,
  defaultValue
}: {
  label: string;
  name: string;
  required?: boolean;
  mono?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink/60 mb-1">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={`w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}

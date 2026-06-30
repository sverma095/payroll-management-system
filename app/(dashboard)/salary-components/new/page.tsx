import { createSalaryComponent } from "../actions";
import { Alert } from "@/components/alert";

export default function NewSalaryComponentPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-semibold text-ink mb-1">Add salary component</h1>
      <p className="text-sm text-ink/50 mb-6">
        Component code must be unique — it&apos;s the variable name you&apos;ll
        use in formulas (e.g. <code className="font-mono">Basic</code>,{" "}
        <code className="font-mono">HRA</code>).
      </p>

      <form action={createSalaryComponent} className="bg-white border border-line rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Component name</label>
            <input name="component_name" required className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Component code</label>
            <input name="component_code" required placeholder="BASIC" className="w-full rounded-lg border border-line px-3 py-2 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1.5">Type</label>
          <select name="component_type" defaultValue="earning" className="w-full rounded-lg border border-line px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
            <option value="earning">Earning</option>
            <option value="deduction">Deduction</option>
            <option value="employer_contribution">Employer contribution</option>
          </select>
        </div>

        <div className="flex gap-5 text-sm text-ink/70">
          <label className="flex items-center gap-1.5"><input type="checkbox" name="taxable" defaultChecked /> Taxable</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" name="pf_applicable" /> PF applicable</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" name="esi_applicable" /> ESI applicable</label>
        </div>

        {searchParams?.error && <Alert>{searchParams.error}</Alert>}

        <div className="pt-2">
          <button type="submit" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors">
            Save component
          </button>
        </div>
      </form>
    </div>
  );
}

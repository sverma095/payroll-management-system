import { createStructure } from "../actions";
import { Alert } from "@/components/alert";

export default function NewSalaryStructurePage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-xl font-semibold text-ink mb-1">New salary structure</h1>
      <p className="text-sm text-ink/50 mb-6">
        Add formula lines once this is created.
      </p>

      <form action={createStructure} className="bg-white border border-line rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1.5">Structure name</label>
          <input name="structure_name" required placeholder="Standard 2026" className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Effective from</label>
            <input name="effective_from" type="date" required className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Effective to</label>
            <input name="effective_to" type="date" className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>
        </div>

        {searchParams?.error && <Alert>{searchParams.error}</Alert>}

        <div className="pt-2">
          <button type="submit" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors">
            Create structure
          </button>
        </div>
      </form>
    </div>
  );
}

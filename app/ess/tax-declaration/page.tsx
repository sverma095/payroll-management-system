import { createClient } from "@/lib/supabase/server";
import { saveDeclaration } from "./actions";

function currentFY() {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
}

export default async function TaxDeclarationPage() {
  const supabase = createClient();
  const fy = currentFY();
  const { data: existing } = await supabase.from("tax_declarations").select("regime, declared_amount, status").eq("financial_year", fy).maybeSingle();

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-xl font-semibold text-ink mb-1">Tax Declaration ({fy})</h1>
      <p className="text-sm text-ink/50 mb-6">Choose your regime and declare investment/deduction amount (80C/80D/HRA etc., combined).</p>
      {existing && <p className="text-xs text-accent mb-4">Current: {existing.regime} regime, ₹{existing.declared_amount} declared, status {existing.status}.</p>}
      <form action={saveDeclaration} className="bg-white border border-line rounded-xl p-5 space-y-3">
        <input type="hidden" name="financial_year" value={fy} />
        <select name="regime" defaultValue={existing?.regime ?? "new"} className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm bg-white">
          <option value="new">New regime</option>
          <option value="old">Old regime</option>
        </select>
        <input name="declared_amount" type="number" defaultValue={existing?.declared_amount ?? 0} placeholder="Declared deductions (old regime only)" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
        <button type="submit" className="w-full rounded-lg bg-accent text-white text-sm font-medium py-2 hover:bg-accent/90">Save declaration</button>
      </form>
    </div>
  );
}

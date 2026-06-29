import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { addDocument } from "./actions";

export default async function DocumentsPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const [{ data: docs }, { data: employees }] = await Promise.all([
    companyId ? supabase.from("documents").select("id, doc_name, doc_url, category, employees(employee_code)").eq("company_id", companyId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    companyId ? supabase.from("employees").select("id, employee_code, first_name").eq("company_id", companyId) : Promise.resolve({ data: [] as any[] })
  ]);
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Documents</h1>
      <p className="text-sm text-ink/50 mb-6">Offer letters, policies, employee documents — links to external storage (no file upload yet).</p>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm"><tbody>
            {docs && docs.length > 0 ? docs.map((d: any) => (
              <tr key={d.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink">{d.doc_name}</td>
                <td className="px-4 py-2.5 text-ink/50">{d.category}</td>
                <td className="px-4 py-2.5 text-ink/50">{d.employees?.employee_code ?? "Company-wide"}</td>
                <td className="px-4 py-2.5"><a href={d.doc_url} target="_blank" className="text-accent hover:underline">Open</a></td>
              </tr>
            )) : <tr><td className="px-4 py-10 text-center text-ink/40">No documents yet.</td></tr>}
          </tbody></table>
        </div>
        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Add document</h2>
          <form action={addDocument} className="space-y-3">
            <input name="doc_name" required placeholder="Document name" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="doc_url" required placeholder="URL" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <select name="category" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="general">General</option>
              <option value="policy">Policy</option>
              <option value="offer_letter">Offer letter</option>
              <option value="contract">Contract</option>
            </select>
            <select name="employee_id" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="">Company-wide</option>
              {(employees ?? []).map((e: any) => <option key={e.id} value={e.id}>{e.employee_code} — {e.first_name}</option>)}
            </select>
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">Save</button>
          </form>
        </section>
      </div>
    </div>
  );
}

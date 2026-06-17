import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CompaniesPage() {
  const supabase = createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, company_name, legal_name, pan, gstin, status")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Companies</h1>
          <p className="text-sm text-ink/50 mt-1">
            Legal entities under your tenant. Each has its own PAN, GSTIN and
            compliance configuration.
          </p>
        </div>
        <Link
          href="/companies/new"
          className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors"
        >
          Add company
        </Link>
      </div>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="px-5 py-3 font-medium">Legal name</th>
              <th className="px-5 py-3 font-medium font-mono">PAN</th>
              <th className="px-5 py-3 font-medium font-mono">GSTIN</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {companies && companies.length > 0 ? (
              companies.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink">{c.company_name}</td>
                  <td className="px-5 py-3 text-ink/70">{c.legal_name}</td>
                  <td className="px-5 py-3 font-mono text-ink/70">{c.pan}</td>
                  <td className="px-5 py-3 font-mono text-ink/70">
                    {c.gstin ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-accentSoft text-accent capitalize">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                  No companies yet. Add your first company to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

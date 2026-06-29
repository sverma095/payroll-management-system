import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";

export default async function OrgChartPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const { data: employees } = companyId
    ? await supabase.from("employees").select("id, employee_code, first_name, last_name, manager_id, designations(designation_name)").eq("company_id", companyId).eq("status", "active")
    : { data: [] };

  const list = employees ?? [];
  const byManager = new Map<string, typeof list>();
  for (const e of list) {
    const key = e.manager_id ?? "root";
    byManager.set(key, [...(byManager.get(key) ?? []), e]);
  }

  const renderNode = (e: any, depth: number): React.ReactNode => (
    <div key={e.id} style={{ marginLeft: depth * 24 }} className="py-1.5 border-l border-line pl-3 text-sm">
      <span className="text-ink">{e.first_name} {e.last_name ?? ""}</span>
      <span className="text-ink/40 ml-2">{e.employee_code} · {e.designations?.designation_name ?? "—"}</span>
      {(byManager.get(e.id) ?? []).map((c: any) => renderNode(c, depth + 1))}
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Org Chart</h1>
      <p className="text-sm text-ink/50 mb-6">Reporting hierarchy from each employee's manager.</p>
      <div className="bg-white border border-line rounded-xl p-5">
        {(byManager.get("root") ?? []).length > 0
          ? (byManager.get("root") ?? []).map((e: any) => renderNode(e, 0))
          : <p className="text-ink/40 text-sm">No managers assigned yet — set manager_id when editing employees.</p>}
      </div>
    </div>
  );
}

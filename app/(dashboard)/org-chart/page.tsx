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

  // manager_id has only a plain FK, nothing stops a cycle at the data
  // level - and there's no employee-edit UI in this app at all today, so
  // the only way such a cycle could exist is a direct DB edit. Still,
  // recursing over unvalidated data unguarded would hard-crash this page
  // (infinite recursion) rather than just showing a wrong chart, so this
  // tracks visited ids and stops rather than trusting the data shape.
  const renderNode = (e: any, depth: number, seen: Set<string>): React.ReactNode => {
    if (seen.has(e.id)) {
      return (
        <div key={e.id} style={{ marginLeft: depth * 24 }} className="py-1.5 border-l border-line pl-3 text-sm text-warn">
          {e.first_name} {e.last_name ?? ""} — reporting cycle detected, stopping here
        </div>
      );
    }
    const nextSeen = new Set(seen).add(e.id);
    return (
      <div key={e.id} style={{ marginLeft: depth * 24 }} className="py-1.5 border-l border-line pl-3 text-sm">
        <span className="text-ink">{e.first_name} {e.last_name ?? ""}</span>
        <span className="text-ink/40 ml-2">{e.employee_code} · {e.designations?.designation_name ?? "—"}</span>
        {(byManager.get(e.id) ?? []).map((c: any) => renderNode(c, depth + 1, nextSeen))}
      </div>
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Org Chart</h1>
      <p className="text-sm text-ink/50 mb-6">Reporting hierarchy from each employee's manager.</p>
      <div className="bg-white border border-line rounded-xl p-5">
        {(byManager.get("root") ?? []).length > 0
          ? (byManager.get("root") ?? []).map((e: any) => renderNode(e, 0, new Set()))
          : <p className="text-ink/40 text-sm">No managers assigned yet. There's no employee-edit page in this app yet to set manager_id from the UI - it currently has to be set directly in the database.</p>}
      </div>
    </div>
  );
}

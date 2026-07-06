import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { createWorkflow, addStep } from "./actions";

export default async function WorkflowsPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const { data: workflows } = companyId
    ? await supabase.from("workflows").select("id, workflow_name, module_name, workflow_steps(id, step_no, approver_role)").eq("company_id", companyId)
    : { data: [] };

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Workflows</h1>
      <p className="text-sm text-ink/50 mb-6">Define multi-step approval chains. Enforced for Leave; Reimbursement, Variable Pay and other modules still resolve in a single step regardless of what's defined here.</p>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {(workflows ?? []).map((w: any) => (
            <div key={w.id} className="bg-white border border-line rounded-xl p-4">
              <p className="text-sm font-medium text-ink mb-2">{w.workflow_name} <span className="text-ink/40 text-xs">({w.module_name})</span></p>
              <ol className="text-sm text-ink/70 list-decimal pl-4 mb-3">
                {(w.workflow_steps ?? []).sort((a: any, b: any) => a.step_no - b.step_no).map((s: any) => <li key={s.id}>{s.approver_role}</li>)}
              </ol>
              <form action={addStep} className="flex gap-2">
                <input type="hidden" name="workflow_id" value={w.id} />
                <input name="step_no" type="number" placeholder="#" className="w-14 rounded border border-line px-1.5 py-1 text-xs" />
                <input name="approver_role" placeholder="Approver role" className="flex-1 rounded border border-line px-1.5 py-1 text-xs" />
                <button className="text-xs text-accent hover:underline">Add step</button>
              </form>
            </div>
          ))}
          {(!workflows || workflows.length === 0) && <p className="text-ink/40 text-sm">No workflows defined yet.</p>}
        </div>
        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">New workflow</h2>
          <form action={createWorkflow} className="space-y-3">
            <input name="workflow_name" required placeholder="Name" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="module_name" required placeholder="Module (leave, reimbursement...)" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">Create</button>
          </form>
        </section>
      </div>
    </div>
  );
}

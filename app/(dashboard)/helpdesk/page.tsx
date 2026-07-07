import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { resolveTicket } from "./actions";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/alert";

export default async function HelpdeskPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const { data: tickets } = companyId
    ? await supabase.from("helpdesk_tickets").select("id, subject, description, status, employees!inner(employee_code, first_name, company_id)").eq("employees.company_id", companyId).order("created_at", { ascending: false })
    : { data: [] };
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">HR Helpdesk</h1>
      <p className="text-sm text-ink/50 mb-6">Tickets raised by employees from their portal.</p>
      {searchParams?.error && <Alert>{searchParams.error}</Alert>}
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm"><tbody>
          {tickets && tickets.length > 0 ? tickets.map((t: any) => (
            <tr key={t.id} className="border-b border-line last:border-0">
              <td className="px-4 py-2.5 text-ink">{t.employees?.employee_code} — {t.employees?.first_name}</td>
              <td className="px-4 py-2.5 text-ink">{t.subject}</td>
              <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
              <td className="px-4 py-2.5">
                {t.status === "open" && <form action={resolveTicket}><input type="hidden" name="id" value={t.id} /><button className="text-xs text-accent hover:underline">Resolve</button></form>}
              </td>
            </tr>
          )) : <tr><td className="px-0 py-2"><EmptyState message="No tickets yet." /></td></tr>}
        </tbody></table>
        </div>
      </div>
    </div>
  );
}

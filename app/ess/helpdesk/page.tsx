import { createClient } from "@/lib/supabase/server";
import { raiseTicket } from "./actions";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";

export default async function MyHelpdeskPage() {
  const supabase = createClient();
  const { data: tickets } = await supabase.from("helpdesk_tickets").select("id, subject, status").order("created_at", { ascending: false });
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Helpdesk</h1>
      <p className="text-sm text-ink/50 mb-6">Raise a query for HR.</p>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm"><tbody>
            {tickets && tickets.length > 0 ? tickets.map((t: any) => (
              <tr key={t.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink">{t.subject}</td>
                <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
              </tr>
            )) : <tr><td className="px-0 py-2"><EmptyState message="No tickets yet." /></td></tr>}
          </tbody></table>
        </div>
        <section className="bg-white border border-line rounded-xl p-5">
          <form action={raiseTicket} className="space-y-3">
            <input name="subject" required placeholder="Subject" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <textarea name="description" placeholder="Details" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">Raise ticket</button>
          </form>
        </section>
      </div>
    </div>
  );
}

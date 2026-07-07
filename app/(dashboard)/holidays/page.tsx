import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { addHoliday, deleteHoliday } from "./actions";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";

export default async function HolidaysPage() {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  const { data: holidays } = companyId
    ? await supabase.from("holidays").select("id, holiday_date, name").eq("company_id", companyId).order("holiday_date")
    : { data: [] };
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Holiday Calendar</h1>
      <p className="text-sm text-ink/50 mb-6">Holidays here are excluded from working days in LOP/payroll calculations.</p>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Holiday</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
            {holidays && holidays.length > 0 ? holidays.map((h: any) => (
              <tr key={h.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-mono text-ink/70">{formatDate(h.holiday_date)}</td>
                <td className="px-4 py-2.5 text-ink">{h.name}</td>
                <td className="px-4 py-2.5"><form action={deleteHoliday}><input type="hidden" name="id" value={h.id} /><button className="text-xs text-warn hover:underline">Delete</button></form></td>
              </tr>
            )) : <tr><td colSpan={3} className="px-0 py-2"><EmptyState message="No holidays added yet." /></td></tr>}
          </tbody></table>
          </div>
        </div>
        <section className="bg-white border border-line rounded-xl p-5">
          <form action={addHoliday} className="space-y-3">
            <input name="holiday_date" type="date" required className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="name" required placeholder="Holiday name" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">Add</button>
          </form>
        </section>
      </div>
    </div>
  );
}

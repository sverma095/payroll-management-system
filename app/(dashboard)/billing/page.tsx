import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { saveSubscription, saveBranding } from "./actions";

export default async function BillingPage() {
  const supabase = createClient();
  const { tenantId, companyId } = await resolveCompanyId(supabase);

  const { data: sub } = tenantId
    ? await supabase.from("subscriptions").select("plan, seats, status, renews_on").eq("tenant_id", tenantId).maybeSingle()
    : { data: null };

  const { data: company } = companyId
    ? await supabase.from("companies").select("id, company_name, logo_url, theme_color").eq("id", companyId).maybeSingle()
    : { data: null };

  const { count: employeeCount } = companyId
    ? await supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active")
    : { count: 0 };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-ink mb-1">Billing &amp; White Labelling</h1>
      <p className="text-sm text-ink/50 mb-6">Subscription plan and per-company branding.</p>

      <div className="grid grid-cols-2 gap-6">
        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Subscription</h2>
          <p className="text-xs text-ink/50 mb-3">{employeeCount ?? 0} active employees using seats.</p>
          <form action={saveSubscription} className="space-y-3">
            <select name="plan" defaultValue={sub?.plan ?? "trial"} className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white">
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <input name="seats" type="number" defaultValue={sub?.seats ?? 10} className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="renews_on" type="date" defaultValue={sub?.renews_on ?? ""} className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">Save</button>
          </form>
        </section>

        <section className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Branding</h2>
          <form action={saveBranding} className="space-y-3">
            <input type="hidden" name="company_id" value={company?.id ?? ""} />
            <input name="logo_url" defaultValue={company?.logo_url ?? ""} placeholder="Logo URL" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs" />
            <input name="theme_color" type="color" defaultValue={company?.theme_color ?? "#2F5D50"} className="w-full h-8 rounded-lg border border-line" />
            <button type="submit" className="w-full rounded-lg bg-accent text-white text-xs font-medium py-1.5 hover:bg-accent/90">Save</button>
          </form>
        </section>
      </div>
    </div>
  );
}

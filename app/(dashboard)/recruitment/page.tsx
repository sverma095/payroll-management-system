import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { createJobPosting, setJobPostingStatus } from "./actions";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/alert";
import { Toast } from "@/components/toast";
import Link from "next/link";

export default async function RecruitmentPage({
  searchParams
}: {
  searchParams: { error?: string; toast?: string };
}) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);

  const [{ data: postings }, { data: departments }, { data: designations }] = await Promise.all([
    companyId
      ? supabase
          .from("job_postings")
          .select("id, title, employment_type, location, openings_count, status, created_at, departments(department_name)")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase.from("departments").select("id, department_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] }),
    companyId
      ? supabase.from("designations").select("id, designation_name").eq("company_id", companyId).eq("status", "active")
      : Promise.resolve({ data: [] as any[] })
  ]);

  const postingIds = (postings ?? []).map((p: any) => p.id);
  const { data: candidateCounts } = postingIds.length
    ? await supabase.from("candidates").select("job_posting_id, stage").in("job_posting_id", postingIds)
    : { data: [] as any[] };

  const countsByPosting = new Map<string, { total: number; hired: number }>();
  (candidateCounts ?? []).forEach((c: any) => {
    const cur = countsByPosting.get(c.job_posting_id) ?? { total: 0, hired: 0 };
    cur.total += 1;
    if (c.stage === "hired") cur.hired += 1;
    countsByPosting.set(c.job_posting_id, cur);
  });

  return (
    <div className="p-8">
      <Toast />
      <h1 className="text-xl font-semibold text-ink mb-1">Recruitment</h1>
      <p className="text-sm text-ink/50 mb-6">Job postings, candidate pipeline, interviews, and offers.</p>
      {searchParams?.error && <Alert>{searchParams.error}</Alert>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-line rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink/50">
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Department</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium text-right">Openings</th>
                  <th className="px-4 py-2.5 font-medium text-right">Candidates</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {postings && postings.length > 0 ? (
                  postings.map((p: any) => {
                    const counts = countsByPosting.get(p.id) ?? { total: 0, hired: 0 };
                    return (
                      <tr key={p.id} className="border-b border-line last:border-0 hover:bg-paper/60 transition-colors">
                        <td className="px-4 py-2.5 text-ink">
                          <Link href={`/recruitment/${p.id}`} className="hover:text-accent hover:underline">
                            {p.title}
                          </Link>
                          {p.location && <span className="text-ink/40 text-xs ml-2">{p.location}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-ink/70">{p.departments?.department_name ?? "—"}</td>
                        <td className="px-4 py-2.5 text-ink/70 capitalize">{p.employment_type.replace("_", " ")}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{p.openings_count}</td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {counts.total}
                          {counts.hired > 0 && <span className="text-positive-text text-xs ml-1">({counts.hired} hired)</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-2.5">
                          {p.status !== "closed" && (
                            <form action={setJobPostingStatus}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="status" value="closed" />
                              <button className="text-xs text-ink/40 hover:text-warn">Close</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-0 py-2">
                      <EmptyState message="No job postings yet. Post your first opening to start building a pipeline." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl p-5 shadow-card h-fit">
          <h2 className="text-sm font-semibold text-ink mb-3">Post a job</h2>
          <form action={createJobPosting} className="space-y-3">
            <input name="title" required placeholder="Role title" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
            <select name="department_id" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm bg-white">
              <option value="">Department (optional)</option>
              {(departments ?? []).map((d: any) => (
                <option key={d.id} value={d.id}>{d.department_name}</option>
              ))}
            </select>
            <select name="designation_id" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm bg-white">
              <option value="">Designation (optional)</option>
              {(designations ?? []).map((d: any) => (
                <option key={d.id} value={d.id}>{d.designation_name}</option>
              ))}
            </select>
            <select name="employment_type" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm bg-white">
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
            <input name="location" placeholder="Location (optional)" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
            <input name="openings_count" type="number" min="1" defaultValue="1" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
            <textarea name="description" placeholder="Description (optional)" rows={3} className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
            <button
              type="submit"
              className="w-full rounded-lg bg-accent text-white text-sm font-medium py-2 hover:bg-accent/90 transition-colors"
            >
              Post job
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

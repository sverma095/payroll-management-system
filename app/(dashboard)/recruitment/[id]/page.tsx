import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  addCandidate,
  moveCandidateStage,
  scheduleInterview,
  recordInterviewOutcome,
  createOffer,
  decideOffer
} from "../actions";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"];

export default async function JobPostingDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();

  const { data: posting } = await supabase
    .from("job_postings")
    .select("id, title, employment_type, location, description, openings_count, status, departments(department_name), designations(designation_name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!posting) notFound();

  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, full_name, email, phone, source, stage, created_at")
    .eq("job_posting_id", params.id)
    .order("created_at", { ascending: false });

  const candidateIds = (candidates ?? []).map((c: any) => c.id);
  const [{ data: interviews }, { data: offers }] = candidateIds.length
    ? await Promise.all([
        supabase.from("interviews").select("id, candidate_id, scheduled_at, interviewer_name, mode, status, feedback, rating").in("candidate_id", candidateIds).order("scheduled_at"),
        supabase.from("offers").select("id, candidate_id, offered_ctc, joining_date, status").in("candidate_id", candidateIds)
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  const interviewsByCandidate = new Map<string, any[]>();
  (interviews ?? []).forEach((i: any) => {
    const list = interviewsByCandidate.get(i.candidate_id) ?? [];
    list.push(i);
    interviewsByCandidate.set(i.candidate_id, list);
  });
  const offerByCandidate = new Map<string, any>();
  (offers ?? []).forEach((o: any) => offerByCandidate.set(o.candidate_id, o));

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/recruitment" className="text-xs text-ink/40 hover:text-ink/60">← All postings</Link>
      <div className="flex items-start justify-between mt-2 mb-1">
        <h1 className="text-xl font-semibold text-ink">{posting.title}</h1>
        <StatusBadge status={posting.status} />
      </div>
      <p className="text-sm text-ink/50 mb-6">
        {(posting as any).departments?.department_name ?? "No department"} · {(posting as any).designations?.designation_name ?? "No designation"}
        {posting.location && ` · ${posting.location}`} · {posting.openings_count} opening(s)
      </p>
      {searchParams?.error && <Alert>{searchParams.error}</Alert>}

      <div className="bg-white border border-line rounded-xl p-5 shadow-card mb-6">
        <h2 className="text-sm font-semibold text-ink mb-3">Add a candidate</h2>
        <form action={addCandidate} className="grid grid-cols-4 gap-3 items-end">
          <input type="hidden" name="job_posting_id" value={posting.id} />
          <input name="full_name" required placeholder="Full name" className="rounded-lg border border-line px-2.5 py-1.5 text-sm" />
          <input name="email" required type="email" placeholder="Email" className="rounded-lg border border-line px-2.5 py-1.5 text-sm" />
          <input name="phone" placeholder="Phone (optional)" className="rounded-lg border border-line px-2.5 py-1.5 text-sm" />
          <input name="source" placeholder="Source (optional)" className="rounded-lg border border-line px-2.5 py-1.5 text-sm" />
          <button type="submit" className="col-span-4 rounded-lg bg-accent text-white text-sm font-medium py-2 hover:bg-accent/90 transition-colors">
            Add candidate
          </button>
        </form>
      </div>

      {!candidates || candidates.length === 0 ? (
        <EmptyState message="No candidates yet for this posting." />
      ) : (
        <div className="space-y-4">
          {candidates.map((c: any) => {
            const candidateInterviews = interviewsByCandidate.get(c.id) ?? [];
            const offer = offerByCandidate.get(c.id);
            return (
              <div key={c.id} className="bg-white border border-line rounded-xl p-5 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{c.full_name}</p>
                    <p className="text-xs text-ink/50">
                      {c.email}{c.phone && ` · ${c.phone}`}{c.source && ` · via ${c.source}`}
                    </p>
                  </div>
                  <StatusBadge status={c.stage} />
                </div>

                <form action={moveCandidateStage} className="flex items-center gap-2 mt-3">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="job_posting_id" value={posting.id} />
                  <span className="text-xs text-ink/40">Move to:</span>
                  <select name="stage" defaultValue={c.stage} className="rounded border border-line px-2 py-1 text-xs bg-white">
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button className="text-xs text-accent hover:underline">Update</button>
                </form>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-line">
                  <div>
                    <p className="text-xs font-medium text-ink/60 mb-2">Interviews</p>
                    {candidateInterviews.map((iv: any) => (
                      <div key={iv.id} className="text-xs text-ink/70 mb-2 border-b border-line pb-2 last:border-0">
                        <p>
                          {new Date(iv.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} with {iv.interviewer_name} ({iv.mode})
                          {" — "}
                          <StatusBadge status={iv.status} />
                        </p>
                        {iv.status === "scheduled" ? (
                          <form action={recordInterviewOutcome} className="flex items-center gap-1 mt-1">
                            <input type="hidden" name="id" value={iv.id} />
                            <input type="hidden" name="job_posting_id" value={posting.id} />
                            <input type="hidden" name="status" value="completed" />
                            <input name="rating" type="number" min="1" max="5" placeholder="1-5" className="w-14 rounded border border-line px-1.5 py-0.5" />
                            <input name="feedback" placeholder="Feedback" className="flex-1 rounded border border-line px-1.5 py-0.5" />
                            <button className="text-accent hover:underline">Log outcome</button>
                          </form>
                        ) : (
                          iv.feedback && <p className="text-ink/50 mt-1">&ldquo;{iv.feedback}&rdquo; {iv.rating && `(${iv.rating}/5)`}</p>
                        )}
                      </div>
                    ))}
                    <form action={scheduleInterview} className="flex flex-col gap-1.5">
                      <input type="hidden" name="candidate_id" value={c.id} />
                      <input type="hidden" name="job_posting_id" value={posting.id} />
                      <input name="scheduled_at" type="datetime-local" required className="rounded border border-line px-2 py-1 text-xs" />
                      <input name="interviewer_name" required placeholder="Interviewer" className="rounded border border-line px-2 py-1 text-xs" />
                      <select name="mode" className="rounded border border-line px-2 py-1 text-xs bg-white">
                        <option value="video">Video</option>
                        <option value="phone">Phone</option>
                        <option value="in_person">In person</option>
                      </select>
                      <button className="text-xs text-accent hover:underline text-left">+ Schedule interview</button>
                    </form>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink/60 mb-2">Offer</p>
                    {offer ? (
                      <div className="text-xs text-ink/70">
                        <p>
                          ₹{Number(offer.offered_ctc).toLocaleString("en-IN")} CTC
                          {offer.joining_date && ` · joining ${offer.joining_date}`}
                          {" — "}
                          <StatusBadge status={offer.status} />
                        </p>
                        {offer.status === "draft" && (
                          <form action={decideOffer} className="mt-1">
                            <input type="hidden" name="id" value={offer.id} />
                            <input type="hidden" name="job_posting_id" value={posting.id} />
                            <input type="hidden" name="candidate_id" value={c.id} />
                            <input type="hidden" name="status" value="sent" />
                            <button className="text-accent hover:underline">Mark as sent</button>
                          </form>
                        )}
                        {offer.status === "sent" && (
                          <div className="flex gap-2 mt-1">
                            <form action={decideOffer}>
                              <input type="hidden" name="id" value={offer.id} />
                              <input type="hidden" name="job_posting_id" value={posting.id} />
                              <input type="hidden" name="candidate_id" value={c.id} />
                              <input type="hidden" name="status" value="accepted" />
                              <button className="text-accent hover:underline">Accepted</button>
                            </form>
                            <form action={decideOffer}>
                              <input type="hidden" name="id" value={offer.id} />
                              <input type="hidden" name="job_posting_id" value={posting.id} />
                              <input type="hidden" name="candidate_id" value={c.id} />
                              <input type="hidden" name="status" value="declined" />
                              <button className="text-warn hover:underline">Declined</button>
                            </form>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form action={createOffer} className="flex flex-col gap-1.5">
                        <input type="hidden" name="candidate_id" value={c.id} />
                        <input type="hidden" name="job_posting_id" value={posting.id} />
                        <input name="offered_ctc" type="number" placeholder="Offered CTC (annual)" required className="rounded border border-line px-2 py-1 text-xs" />
                        <input name="joining_date" type="date" className="rounded border border-line px-2 py-1 text-xs" />
                        <button className="text-xs text-accent hover:underline text-left">+ Create offer</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

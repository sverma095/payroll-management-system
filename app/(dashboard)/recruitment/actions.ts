"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createJobPosting(formData: FormData) {
  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect(`/recruitment?error=${encodeURIComponent("Create a company first")}`);
  }

  const { error } = await supabase.from("job_postings").insert({
    company_id: companyId,
    title: String(formData.get("title") ?? ""),
    department_id: String(formData.get("department_id") ?? "") || null,
    designation_id: String(formData.get("designation_id") ?? "") || null,
    employment_type: String(formData.get("employment_type") ?? "full_time"),
    location: String(formData.get("location") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    openings_count: Number(formData.get("openings_count") ?? 1)
  });

  if (error) {
    redirect(`/recruitment?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/recruitment");
  redirect("/recruitment?toast=Job+posting+created");
}

export async function setJobPostingStatus(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const { error } = await supabase.from("job_postings").update({ status }).eq("id", id);
  if (error) {
    redirect(`/recruitment?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/recruitment");
  revalidatePath(`/recruitment/${id}`);
}

export async function addCandidate(formData: FormData) {
  const supabase = createClient();
  const jobPostingId = String(formData.get("job_posting_id") ?? "");

  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent("Enter a valid email")}`);
  }

  const { error } = await supabase.from("candidates").insert({
    job_posting_id: jobPostingId,
    full_name: String(formData.get("full_name") ?? ""),
    email,
    phone: String(formData.get("phone") ?? "") || null,
    source: String(formData.get("source") ?? "") || null
  });

  if (error) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/recruitment/${jobPostingId}`);
}

const STAGE_ORDER = ["applied", "screening", "interview", "offer", "hired"];

export async function moveCandidateStage(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  const jobPostingId = String(formData.get("job_posting_id") ?? "");
  const stage = String(formData.get("stage") ?? "");

  if (stage !== "rejected" && !STAGE_ORDER.includes(stage)) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent("Invalid stage")}`);
  }

  const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
  if (error) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/recruitment/${jobPostingId}`);
}

export async function scheduleInterview(formData: FormData) {
  const supabase = createClient();
  const candidateId = String(formData.get("candidate_id") ?? "");
  const jobPostingId = String(formData.get("job_posting_id") ?? "");
  const scheduledAt = String(formData.get("scheduled_at") ?? "");

  if (!scheduledAt) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent("Pick a date and time")}`);
  }

  const { error } = await supabase.from("interviews").insert({
    candidate_id: candidateId,
    scheduled_at: new Date(scheduledAt).toISOString(),
    interviewer_name: String(formData.get("interviewer_name") ?? ""),
    mode: String(formData.get("mode") ?? "video")
  });

  if (error) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent(error.message)}`);
  }

  // Scheduling an interview is a reasonable signal to move the candidate
  // into the interview stage if they haven't been moved there already.
  await supabase.from("candidates").update({ stage: "interview" }).eq("id", candidateId).eq("stage", "screening");

  revalidatePath(`/recruitment/${jobPostingId}`);
}

export async function recordInterviewOutcome(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  const jobPostingId = String(formData.get("job_posting_id") ?? "");
  const status = String(formData.get("status") ?? "completed");
  const feedback = String(formData.get("feedback") ?? "") || null;
  const ratingRaw = formData.get("rating");
  const rating = ratingRaw ? Number(ratingRaw) : null;

  const { error } = await supabase.from("interviews").update({ status, feedback, rating }).eq("id", id);
  if (error) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/recruitment/${jobPostingId}`);
}

export async function createOffer(formData: FormData) {
  const supabase = createClient();
  const candidateId = String(formData.get("candidate_id") ?? "");
  const jobPostingId = String(formData.get("job_posting_id") ?? "");
  const offeredCtc = Number(formData.get("offered_ctc") ?? 0);

  if (offeredCtc <= 0) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent("Enter an offered CTC greater than zero")}`);
  }

  const { error } = await supabase.from("offers").insert({
    candidate_id: candidateId,
    offered_ctc: offeredCtc,
    joining_date: String(formData.get("joining_date") ?? "") || null,
    status: "draft"
  });

  if (error) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("candidates").update({ stage: "offer" }).eq("id", candidateId);
  revalidatePath(`/recruitment/${jobPostingId}`);
}

export async function decideOffer(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  const jobPostingId = String(formData.get("job_posting_id") ?? "");
  const candidateId = String(formData.get("candidate_id") ?? "");
  const status = String(formData.get("status") ?? ""); // sent | accepted | declined | withdrawn

  const { error } = await supabase.from("offers").update({ status }).eq("id", id);
  if (error) {
    redirect(`/recruitment/${jobPostingId}?error=${encodeURIComponent(error.message)}`);
  }

  if (status === "accepted") {
    await supabase.from("candidates").update({ stage: "hired" }).eq("id", candidateId);
  }

  revalidatePath(`/recruitment/${jobPostingId}`);
}

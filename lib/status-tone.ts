export type StatusTone = "neutral" | "positive" | "caution" | "critical";

const TONE_BY_STATUS: Record<string, StatusTone> = {
  // employees
  draft: "neutral",
  active: "positive",
  probation: "caution",
  confirmed: "positive",
  notice_period: "caution",
  relieved: "critical",
  ff_completed: "neutral",
  archived: "neutral",
  // leave / reimbursements / claims / helpdesk / payroll headers / invites
  pending: "caution",
  open: "caution",
  approved: "positive",
  processed: "positive",
  resolved: "positive",
  locked: "neutral",
  rejected: "critical",
  cancelled: "neutral",
  closed: "neutral",
  // recruitment: job postings
  on_hold: "caution",
  // recruitment: candidate stages
  applied: "neutral",
  screening: "caution",
  interview: "caution",
  offer: "caution",
  hired: "positive",
  // recruitment: interviews
  scheduled: "caution",
  completed: "positive",
  // recruitment: offers
  sent: "caution",
  accepted: "positive",
  declined: "critical",
  withdrawn: "neutral"
};

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  return TONE_BY_STATUS[status] ?? "neutral";
}

export const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-neutral-soft text-neutral-text",
  positive: "bg-positive-soft text-positive-text",
  caution: "bg-caution-soft text-caution-text",
  critical: "bg-critical-soft text-critical-text"
};

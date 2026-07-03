"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/current-company";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PAN_REGEX, IFSC_REGEX, UAN_REGEX } from "@/lib/validators/india";
import { isValidAadhaar } from "@/lib/validators/aadhaar";
import { generateInviteCode } from "@/lib/invite-code";

const employeeSchema = z.object({
  employee_code: z.string().min(1, "Employee code is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  doj: z.string().min(1, "Date of joining is required"),
  gender: z.string().optional().or(z.literal("")),
  pan: z
    .string()
    .regex(PAN_REGEX, "PAN must look like ABCDE1234F")
    .optional()
    .or(z.literal("")),
  aadhaar: z
    .string()
    .refine((v) => v === "" || isValidAadhaar(v), "Aadhaar number is invalid")
    .optional()
    .or(z.literal("")),
  uan: z
    .string()
    .regex(UAN_REGEX, "UAN must be 12 digits")
    .optional()
    .or(z.literal("")),
  esic_number: z.string().optional().or(z.literal("")),
  department_id: z.string().optional().or(z.literal("")),
  designation_id: z.string().optional().or(z.literal("")),
  branch_id: z.string().optional().or(z.literal("")),
  bank_name: z.string().optional().or(z.literal("")),
  account_number: z.string().optional().or(z.literal("")),
  ifsc: z
    .string()
    .refine((v) => v === "" || IFSC_REGEX.test(v), "IFSC must look like ABCD0123456")
    .optional()
    .or(z.literal("")),
  beneficiary_name: z.string().optional().or(z.literal(""))
});

export async function createEmployee(formData: FormData) {
  const raw = Object.fromEntries(
    Array.from(formData.entries()).map(([k, v]) => [k, String(v)])
  );
  raw.pan = (raw.pan ?? "").toUpperCase();
  raw.ifsc = (raw.ifsc ?? "").toUpperCase();

  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    redirect(`/employees/new?error=${encodeURIComponent(message)}`);
  }
  const data = parsed.data!;

  const supabase = createClient();
  const { companyId } = await resolveCompanyId(supabase);
  if (!companyId) {
    redirect(`/employees/new?error=${encodeURIComponent("Create a company first")}`);
  }

  // Acceptance criteria: unique employee code (per company)
  const { data: existing } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", companyId!)
    .eq("employee_code", data.employee_code)
    .maybeSingle();

  if (existing) {
    redirect(`/employees/new?error=${encodeURIComponent("Employee code already exists")}`);
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: employee, error } = await supabase
    .from("employees")
    .insert({
      company_id: companyId,
      employee_code: data.employee_code,
      first_name: data.first_name,
      last_name: data.last_name || null,
      dob: data.dob || null,
      doj: data.doj,
      gender: data.gender || null,
      pan: data.pan || null,
      aadhaar: data.aadhaar || null,
      uan: data.uan || null,
      esic_number: data.esic_number || null,
      department_id: data.department_id || null,
      designation_id: data.designation_id || null,
      branch_id: data.branch_id || null,
      status: "draft"
    })
    .select()
    .single();

  if (error) {
    redirect(`/employees/new?error=${encodeURIComponent(error.message)}`);
  }

  if (data.account_number && data.ifsc && data.bank_name) {
    await supabase.from("employee_banks").insert({
      employee_id: employee!.id,
      bank_name: data.bank_name,
      account_number: data.account_number,
      ifsc: data.ifsc,
      beneficiary_name: data.beneficiary_name || `${data.first_name} ${data.last_name ?? ""}`.trim(),
      is_primary: true
    });
  }

  await supabase.from("audit_logs").insert({
    user_id: user?.id,
    module_name: "employee_management",
    action: "create_employee",
    old_value_json: null,
    new_value_json: employee
  });

  redirect("/employees");
}

export async function generateInvite(formData: FormData) {
  const employeeId = String(formData.get("employee_id") ?? "");
  if (!employeeId) return;

  const supabase = createClient();

  // Reuse a still-unused code instead of piling up dead invites every time
  // the admin re-opens the page.
  const { data: existing } = await supabase
    .from("invites")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("used", false)
    .maybeSingle();

  if (!existing) {
    await supabase.from("invites").insert({ employee_id: employeeId, code: generateInviteCode() });
  }

  revalidatePath("/employees");
}

export async function revokeInvite(formData: FormData) {
  const inviteId = String(formData.get("invite_id") ?? "");
  if (!inviteId) return;

  const supabase = createClient();
  await supabase.from("invites").delete().eq("id", inviteId).eq("used", false);
  revalidatePath("/employees");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const signupSchema = z
  .object({
    invite_code: z.string().min(1, "Invite code is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string()
  })
  .refine((v) => v.password === v.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"]
  });

export async function signUp(formData: FormData) {
  const parsed = signupSchema.safeParse({
    invite_code: String(formData.get("invite_code") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirm_password: String(formData.get("confirm_password") ?? "")
  });

  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { invite_code, email, password } = parsed.data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?invite=${encodeURIComponent(invite_code)}`
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Email confirmations off (e.g. local dev) -> we already have a session,
  // so redeem the invite right now instead of waiting on a callback hit.
  if (data.session) {
    const { data: ok } = await supabase.rpc("consume_invite", { invite_code });
    if (!ok) {
      redirect(
        `/signup?error=${encodeURIComponent(
          "That invite code has already been used or is invalid."
        )}`
      );
    }
    redirect("/dashboard");
  }

  redirect("/signup?sent=1");
}

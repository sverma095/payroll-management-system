"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email")
});

export async function requestReset(formData: FormData) {
  const parsed = schema.safeParse({ email: String(formData.get("email") ?? "").trim() });

  if (!parsed.success) {
    redirect(`/forgot-password?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = createClient();

  // Always redirect to the "check your email" state, whether or not the
  // address is registered — otherwise this endpoint becomes a way to probe
  // which emails have accounts.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`
  });

  redirect("/forgot-password?sent=1");
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserEmail } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

/**
 * Notifies an app_user of something (leave decided, ticket resolved, etc):
 * always writes the in-app notification row; also emails them if we can
 * resolve their auth email and RESEND_API_KEY is configured. Email failure
 * (missing key, lookup failure, Resend error) never blocks the in-app
 * notification or the caller's own flow - sendEmail() and getUserEmail()
 * both already swallow their own errors.
 */
export async function notifyUser(
  supabase: SupabaseClient,
  appUserId: string,
  title: string,
  body: string
) {
  await supabase.from("notifications").insert({ user_id: appUserId, title, body });

  const email = await getUserEmail(appUserId);
  if (email) {
    await sendEmail(email, title, `<p>${body}</p>`);
  }
}

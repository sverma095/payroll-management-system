import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) client. Bypasses RLS entirely - only ever use this
 * for narrow, specific lookups (like resolving an auth user's email to
 * send a notification), never for general data access. Returns null
 * rather than throwing when SUPABASE_SERVICE_ROLE_KEY isn't configured, so
 * callers can treat "can't look this up" as a soft failure.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** The auth email for an app_users.id (== auth.users.id), or null if unavailable. */
export async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) return null;
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

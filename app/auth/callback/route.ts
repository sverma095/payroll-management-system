import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// Supabase emails (signup confirmation + password recovery) both link here
// with a `code` param. We exchange it for a session, then branch:
//   - recovery links carry `type=recovery` -> send the user to set a new
//     password
//   - signup confirmation links carry our own `invite` param (round-tripped
//     via emailRedirectTo in app/signup/actions.ts) -> redeem the invite
//     code now that the user has a real session, then land them in ESS
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const invite = searchParams.get("invite");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Invalid or expired link`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  if (invite) {
    const { data: ok } = await supabase.rpc("consume_invite", { invite_code: invite });
    if (!ok) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "That invite code has already been used or is invalid. Contact your admin for a new one."
        )}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Keep request and response cookie jars in sync so a token
          // refreshed mid-request is visible for the rest of this
          // invocation, then re-create `response` from the updated
          // request so a later redirect (below) doesn't drop it.
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set(name, "");
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const publicPrefixes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/callback"
  ];
  const isAuthRoute = publicPrefixes.some((p) => request.nextUrl.pathname.startsWith(p));
  const isPublicAsset = request.nextUrl.pathname.startsWith("/_next");

  if (!user && !isAuthRoute && !isPublicAsset) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c));
    return redirectResponse;
  }

  // reset-password needs a logged-in (recovery) session to set the new
  // password, so — unlike the other auth routes — it should NOT bounce an
  // authenticated user back to /dashboard.
  if (user && isAuthRoute && request.nextUrl.pathname !== "/reset-password") {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c));
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

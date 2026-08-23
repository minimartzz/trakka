import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  // update user's auth session
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Signed-in users skip the landing page entirely, so they never paint it
  // before being sent on. The authoritative auth check still lives in the
  // account layout — this is a UX redirect, not a security boundary.
  if (user && pathname === "/") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl, { headers: response.headers });
  }

  // Add invite link to cookies on /join
  if (pathname.startsWith("/join")) {
    const segments = pathname.split("/");
    const inviteCode = segments[2];

    if (inviteCode) {
      response.cookies.set("pending_invite_code", inviteCode, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match page navigations only. Everything excluded below either needs no
     * session refresh or already authenticates itself, and each request that
     * runs this proxy costs an auth round trip to Supabase plus a second
     * Fast Origin Transfer charge on Vercel.
     * - _next/static, _next/image: build output and optimized images
     * - api: route handlers call supabase.auth.getUser() themselves
     * - monitoring: Sentry's tunnel route (kept out in case it is re-enabled)
     * - favicon/robots/sitemap and any file with a static asset extension
     */
    "/((?!_next/static|_next/image|api/|monitoring|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf)$).*)",
  ],
};

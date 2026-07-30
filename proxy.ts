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
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

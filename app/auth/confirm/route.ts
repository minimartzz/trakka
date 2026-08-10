import { createClient } from "@/utils/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = "/onboarding";

  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirectTo.searchParams.delete("next");
      return NextResponse.redirect(redirectTo);
    }
  }

  // Confirmation links are single-use, so opening one twice — or on a second
  // device — lands here. That isn't an error worth a dead end: if the visitor
  // already has a session, just send them on.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profile")
      .select("onboarding_completed_at")
      .eq("uuid", user.id)
      .single();

    redirectTo.pathname = profile?.onboarding_completed_at
      ? "/dashboard"
      : "/onboarding";
    return NextResponse.redirect(redirectTo);
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("reason", "link_used");
  return NextResponse.redirect(redirectTo);
}

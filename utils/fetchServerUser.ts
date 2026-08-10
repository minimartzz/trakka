import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";

export default cache(async function fetchUser() {
  const supabase = await createClient();

  // From auth.users table
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Fetch profile information
  const { data: profileInfo, error } = await supabase
    .from("profile")
    .select("*")
    .eq("uuid", user.id)
    .single();
  if (error || !profileInfo) {
    redirect("/onboarding");
  }

  // The failover: a profile row exists but the user never finished onboarding
  // (closed the tab, switched device). Every authenticated surface sends them
  // back to pick up where they left off.
  if (!profileInfo.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const profile = {
    ...user,
    ...profileInfo,
  };

  return profile;
});

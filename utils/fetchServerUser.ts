import { createClient, getAuthUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getCallerProfileRow = cache(async () => {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data: profileInfo, error } = await supabase
    .from("profile")
    .select("*")
    .eq("uuid", user.id)
    .single();

  if (error || !profileInfo) {
    return null;
  }

  return profileInfo;
});

export default cache(async function fetchUser() {
  // From auth.users table — shared with requireAuth() so the render only makes
  // one round trip to Supabase Auth
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const profileInfo = await getCallerProfileRow();
  if (!profileInfo) {
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

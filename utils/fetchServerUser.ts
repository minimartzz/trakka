import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { toast } from "sonner";

export default async function fetchUser() {
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
    console.error("Error fetching profile:", error);
    toast.error("Please set up your profile before proceeding");
    redirect("/onboarding");
  }

  const profile = {
    ...user,
    ...profileInfo,
  };

  return profile;
}

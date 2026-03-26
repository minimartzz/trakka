"use server";
import { groupInvitesTable } from "@/db/schema/groupInvites";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import { SignUpActionState, signUpFormSchema } from "@/utils/signUpSchema";
import { createClient } from "@/utils/supabase/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createRequestLoggedIn(
  inviteCode: string,
  groupId: string,
  // profileId is kept for API compatibility but identity is resolved from session
  _profileId: number
) {
  // Resolve caller's identity from session — never trust client-supplied profileId
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile] = await db
    .select({ id: profileTable.id })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  if (!profile) redirect("/login");

  // Insert new group join request
  await db.insert(groupJoinRequestTable).values({
    groupId,
    profileId: profile.id,
  });

  // Remove existing invite code
  await db
    .delete(groupInvitesTable)
    .where(eq(groupInvitesTable.code, inviteCode));

  revalidatePath("/dashboard");

  redirect("/dashboard");
}

// Runs the SQL function to update state based on "accept" or "reject"
export async function handleRequestAction(
  groupId: string,
  profileId: number,
  action: "accept" | "reject"
) {
  const supabase = await createClient();

  // Verify the caller is authenticated and is an admin (roleId 1 or 2) of this group
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const [callerProfile] = await db
    .select({ id: profileTable.id })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  if (!callerProfile) return { success: false, message: "Unauthorized" };

  const [membership] = await db
    .select({ roleId: profileGroupTable.roleId })
    .from(profileGroupTable)
    .where(
      and(
        eq(profileGroupTable.groupId, groupId),
        eq(profileGroupTable.profileId, callerProfile.id),
        inArray(profileGroupTable.roleId, [1, 2]),
      ),
    );

  if (!membership) return { success: false, message: "Unauthorized" };

  const { error } = await supabase.rpc("approve_join_request", {
    p_req_id: profileId,
    p_group_id: groupId,
    p_decision: action,
  });
  if (error) {
    console.error(error);
    return {
      success: false,
      message: "Action failed or already handled by another admin",
    };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Action successful" };
}

// Form action to trigger Login
export async function inviteLogin(formData: FormData) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // Log the user in
  const loginData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword(loginData);
  if (authError || !authData?.user) {
    return redirect("/error");
  }

  // Get the corresponding profile ID
  const profile = await db
    .select({
      id: profileTable.id,
    })
    .from(profileTable)
    .where(eq(profileTable.uuid, authData?.user?.id));

  if (profile.length === 0) {
    console.error("Profile not found for user");
  }

  // Retrieve cookies and invite details
  const inviteCode = cookieStore.get("pending_invite_code")?.value;

  if (inviteCode && authData.user) {
    try {
      const invite = await db
        .select({
          groupId: groupInvitesTable.groupId,
        })
        .from(groupInvitesTable)
        .where(eq(groupInvitesTable.code, inviteCode));

      // Invite code exists: Insert into "groupJoin" table
      if (invite) {
        await db.insert(groupJoinRequestTable).values({
          groupId: invite[0].groupId,
          profileId: profile[0].id,
        });

        // Remove existing invite code
        await db
          .delete(groupInvitesTable)
          .where(eq(groupInvitesTable.code, inviteCode));
      }

      // Delete the invite code
      cookieStore.delete("pending_invite_code");
    } catch (error) {
      console.error("Failed to process auto join:", error);
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// Form action to trigger Login
export async function inviteSignUp(
  _prev: SignUpActionState,
  formData: FormData
): Promise<SignUpActionState> {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const inviteCode = cookieStore.get("pending_invite_code")?.value;

  const signUpData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  // Check the input rules
  const validationResults = signUpFormSchema.safeParse(signUpData);
  if (!validationResults.success) {
    return {
      form: signUpData,
      errors: validationResults.error.flatten().fieldErrors,
    };
  }

  // Sign up the user
  // Store the invite code in the user details
  const { error } = await supabase.auth.signUp({
    ...signUpData,
    options: {
      data: {
        inviteCode: inviteCode || null,
      },
    },
  });

  if (error) {
    redirect("/error");
  }

  // Delete the cookie
  if (inviteCode) cookieStore.delete("pending_invite_code");

  revalidatePath("/", "layout");
  redirect("/login/confirm-email");
}

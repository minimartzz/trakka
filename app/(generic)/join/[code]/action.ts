"use server";
import { groupInvitesTable } from "@/db/schema/groupInvites";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { SignUpActionState, signUpFormSchema } from "@/utils/signUpSchema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createRequestLoggedIn(
  inviteCode: string,
  groupId: string,
  profileId: number
) {
  // Insert new group invite to join request
  await db.insert(groupJoinRequestTable).values({
    groupId,
    profileId,
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

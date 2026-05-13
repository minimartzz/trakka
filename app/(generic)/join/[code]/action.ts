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
  _inviteCode: string,
  groupId: string,
  _profileId: number,
) {
  // Check if user exists from session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile] = await db
    .select({ id: profileTable.id })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  if (!profile) redirect("/login");

  // Spam guard: If user is already a member or already has a pending request
  // skip the insert
  const [existingMembership] = await db
    .select({ profileId: profileGroupTable.profileId })
    .from(profileGroupTable)
    .where(
      and(
        eq(profileGroupTable.groupId, groupId),
        eq(profileGroupTable.profileId, profile.id),
      ),
    );

  if (!existingMembership) {
    const [existingRequest] = await db
      .select({ id: groupJoinRequestTable.id })
      .from(groupJoinRequestTable)
      .where(
        and(
          eq(groupJoinRequestTable.groupId, groupId),
          eq(groupJoinRequestTable.profileId, profile.id),
          eq(groupJoinRequestTable.status, "pending"),
        ),
      );

    if (!existingRequest) {
      await db.insert(groupJoinRequestTable).values({
        groupId,
        profileId: profile.id,
      });
    }
  }

  revalidatePath("/dashboard");

  redirect("/dashboard");
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
      const [invite] = await db
        .select({
          groupId: groupInvitesTable.groupId,
        })
        .from(groupInvitesTable)
        .where(eq(groupInvitesTable.code, inviteCode));

      // Prevent Duplicate Requests: Checks if the user is already a
      // member of the tribe or if they already have a pending request
      if (invite && profile[0]) {
        const [existingMembership] = await db
          .select({ profileId: profileGroupTable.profileId })
          .from(profileGroupTable)
          .where(
            and(
              eq(profileGroupTable.groupId, invite.groupId),
              eq(profileGroupTable.profileId, profile[0].id),
            ),
          );

        if (!existingMembership) {
          const [existingRequest] = await db
            .select({ id: groupJoinRequestTable.id })
            .from(groupJoinRequestTable)
            .where(
              and(
                eq(groupJoinRequestTable.groupId, invite.groupId),
                eq(groupJoinRequestTable.profileId, profile[0].id),
                eq(groupJoinRequestTable.status, "pending"),
              ),
            );

          if (!existingRequest) {
            await db.insert(groupJoinRequestTable).values({
              groupId: invite.groupId,
              profileId: profile[0].id,
            });
          }
        }
      }

      // Clear the pending-invite cookie;
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
  formData: FormData,
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

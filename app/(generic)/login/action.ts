"use server";

import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { SignUpActionState, signUpFormSchema } from "@/utils/signUpSchema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Supabase Auth only signs in by email/phone, so a username has to be
// resolved to its email first. The identifier can be either an email or a
// username; anything without an "@" is treated as a username lookup.
async function resolveEmail(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) {
    return identifier;
  }

  const rows = await db
    .select({ email: profileTable.email })
    .from(profileTable)
    .where(eq(profileTable.username, identifier))
    .limit(1);

  return rows[0]?.email ?? null;
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const identifier = (formData.get("identifier") as string)?.trim();
  const password = formData.get("password") as string;

  const email = await resolveEmail(identifier);

  if (!email) {
    redirect("/login/wrong-password");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login/wrong-password");
  }

  revalidatePath("/", "layout");

  // From anonymous user claim. Claim code automatically filled in on page
  const cookieStore = await cookies();
  const claimCode = cookieStore.get("pending_claim_code")?.value;
  if (claimCode) {
    cookieStore.delete("pending_claim_code");
    redirect(`/account?tab=games&claim=${encodeURIComponent(claimCode)}`);
  }

  redirect("/dashboard");
}

export async function signup(
  _prev: SignUpActionState,
  formData: FormData,
): Promise<SignUpActionState> {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const validationResult = signUpFormSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      form: data,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  // A claim code from a shared link rides along in user metadata (same as an
  // invite code) so it survives email confirmation on another device and can
  // prefill the onboarding claim step.
  const cookieStore = await cookies();
  const claimCode = cookieStore.get("pending_claim_code")?.value;

  const { error } = await supabase.auth.signUp({
    ...data,
    options: { data: { claimCode: claimCode || null } },
  });

  if (error) {
    redirect("/error");
  }

  if (claimCode) cookieStore.delete("pending_claim_code");

  revalidatePath("/", "layout");
  redirect("/login/confirm-email");
}

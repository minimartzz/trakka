"use server";

import { emailSchema, EmailState } from "@/utils/signUpSchema";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function reset(
  _prev: EmailState,
  formData: FormData
): Promise<EmailState> {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
  };
  const validationResult = emailSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      form: data,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(data.email);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/login/confirm-email");
}

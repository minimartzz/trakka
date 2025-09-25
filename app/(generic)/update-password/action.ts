"use server";

import { resetPasswordSchema, ResetPasswordState } from "@/utils/signUpSchema";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updatePassword(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const supabase = await createClient();

  const data = {
    password: formData.get("password") as string,
    confirm: formData.get("confirm") as string,
  };
  const validationResult = resetPasswordSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      form: data,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.auth.updateUser({ password: data.password });

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

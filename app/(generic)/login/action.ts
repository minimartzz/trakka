"use server";

import { SignUpActionState, signUpFormSchema } from "@/utils/signUpSchema";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prev: SignUpActionState,
  formData: FormData
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

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/login/confirm-email");
}

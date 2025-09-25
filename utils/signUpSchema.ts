import { z } from "zod";

// Form validation
export const signUpFormSchema = z.object({
  email: z.email({ message: "Please enter your email" }).trim(),
  password: z
    .string()
    .min(8, { message: "Be at least 8 chracters long" })
    .regex(/[a-zA-z]/, { message: "Contain at least one letter" })
    .regex(/[0-9]/, { message: "Contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Contain at least one special character.",
    })
    .trim(),
});

export type SignUpActionState = {
  form?: {
    email?: string;
    password?: string;
  };
  errors?: {
    email?: string[];
    password?: string[];
  };
};

export const emailSchema = z.object({
  email: z.email({ message: "Please enter your email" }).trim(),
});

export type EmailState = {
  form?: {
    email?: string;
  };
  errors?: {
    email?: string[];
  };
};

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Be at least 8 chracters long" })
      .regex(/[a-zA-z]/, { message: "Contain at least one letter" })
      .regex(/[0-9]/, { message: "Contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Contain at least one special character.",
      })
      .trim(),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export type ResetPasswordState = {
  form?: {
    password?: string;
    confirm?: string;
  };
  errors?: {
    password?: string[];
    confirm?: string[];
  };
};

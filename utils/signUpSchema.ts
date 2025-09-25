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

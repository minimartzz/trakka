"use client";
import { updatePassword } from "@/app/(generic)/update-password/action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ValidatedInput from "@/components/ValidatedInput";
import { resetPasswordSchema } from "@/utils/signUpSchema";
import Image from "next/image";
import React, { useActionState, useState } from "react";

const Page = () => {
  const [submitted, setSubmitted] = useState(false);
  const [state, action, isPending] = useActionState(updatePassword, {});

  const handleResetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    setSubmitted(true);
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    const validationResult = resetPasswordSchema.safeParse(data);
    if (!validationResult.success) {
      event.preventDefault();
    }
  };

  return (
    <div className="flex min-h-screen justify-center items-center bg-background p-4">
      <Card className="w-full max-w-lg p-5">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <Image
              src="/trakka_full.png"
              alt="logo"
              height={160}
              width={160}
              className="dark:hidden"
            />
            <Image
              src="/trakka_full_dark.png"
              alt="logo"
              height={160}
              width={160}
              className="hidden dark:block"
            />
          </CardTitle>
          <CardDescription className="pt-1">
            Key in your email to reset your password
          </CardDescription>
          <form onSubmit={handleResetPassword} action={action} noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <ValidatedInput
                type="password"
                name="password"
                placeholder="Enter your new password"
                submitted={submitted}
                fieldSchema={resetPasswordSchema.shape["password"]}
                defaultValue={state.form?.password}
                errors={state.errors?.password}
              />
              <Label htmlFor="confirm">Confirm Password</Label>
              <ValidatedInput
                type="password"
                name="confirm"
                placeholder="Confirm your new password"
                submitted={submitted}
                fieldSchema={resetPasswordSchema.shape["confirm"]}
                defaultValue={state.form?.confirm}
                errors={state.errors?.confirm}
              />
              <Button className="my-5 w-full cursor-pointer" type="submit">
                Update Password
              </Button>
            </div>
          </form>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Page;

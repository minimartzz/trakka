"use client";
import { reset } from "@/app/(generic)/reset-password/action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ValidatedInput from "@/components/ValidatedInput";
import { emailSchema } from "@/utils/signUpSchema";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";
import React, { useActionState, useState } from "react";

const Page = () => {
  const [submitted, setSubmitted] = useState(false);
  const [state, action, isPending] = useActionState(reset, {});
  const router = useRouter();

  const handleResetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    setSubmitted(true);
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    const validationResult = emailSchema.safeParse(data);
    if (!validationResult.success) {
      event.preventDefault();
    }
  };

  return (
    <div>
      <header className="flex flex-row items-center w-full gap-4 p-5 border-b">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Reset Password</h1>
      </header>
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
                <Label htmlFor="email">Email</Label>
                <ValidatedInput
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  submitted={submitted}
                  fieldSchema={emailSchema.shape["email"]}
                  defaultValue={state.form?.email}
                  errors={state.errors?.email}
                />
                <Button
                  className="my-5 w-full cursor-pointer"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Loading ...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Page;

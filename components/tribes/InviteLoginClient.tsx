"use client";
import { inviteLogin, inviteSignUp } from "@/app/(generic)/join/[code]/action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ValidatedInput from "@/components/ValidatedInput";
import { signUpFormSchema } from "@/utils/signUpSchema";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

const InviteLoginClient = () => {
  // 1. If user is logging in -> Login and automatically populate (adjust login function to include push to DB)
  // 2. If user has not signed up -> Create cookie
  const [activeTab, setActiveTab] = useState("sign-up");
  const [submitted, setSubmitted] = useState(false);
  const [state, action, isPending] = useActionState(inviteSignUp, {});

  const handleSignUpSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setSubmitted(true);
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    const validationResult = signUpFormSchema.safeParse(data);
    if (!validationResult.success) {
      event.preventDefault();
    }
  };

  const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button
        type="submit"
        className="my-5 w-full cursor-pointer"
        disabled={pending}
      >
        {pending ? (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Signing in...</span>
          </div>
        ) : (
          "Sign In"
        )}
      </Button>
    );
  };

  return (
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
          Track your board game performance
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent w-full mb-4">
          <TabsTrigger
            value="login"
            className="h-11 border-x-0 border-t-0 text-base data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-3 data-[state=active]:border-primary cursor-pointer"
          >
            Login
          </TabsTrigger>
          <TabsTrigger
            value="sign-up"
            className="h-11 border-x-0 border-t-0 text-base data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-3 data-[state=active]:border-primary cursor-pointer"
          >
            Sign-Up
          </TabsTrigger>
        </TabsList>

        {/* Login */}
        <TabsContent value="login" className="pt-3">
          <form action={inviteLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className="rounded-sm"
                required
              />
              <Label htmlFor="password" className="pt-2">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                className="rounded-sm"
                required
              />
              <SubmitButton />
            </div>
          </form>
        </TabsContent>

        {/* Sign-Up */}
        <TabsContent value="sign-up">
          <form onSubmit={handleSignUpSubmit} action={action} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <ValidatedInput
                type="email"
                name="email"
                placeholder="Enter your email"
                submitted={submitted}
                fieldSchema={signUpFormSchema.shape["email"]}
                defaultValue={state.form?.email}
                errors={state.errors?.email}
              />
              <Label htmlFor="password" className="pt-2">
                Password
              </Label>
              <ValidatedInput
                type="password"
                name="password"
                placeholder="Enter a password"
                fieldSchema={signUpFormSchema.shape["password"]}
                submitted={submitted}
                defaultValue={state.form?.password}
                errors={state.errors?.password}
              />
              <Button
                className="my-5 w-full cursor-pointer"
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Registering ...</span>
                  </div>
                ) : (
                  "Register"
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default InviteLoginClient;

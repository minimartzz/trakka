"use client";
import { login, signup } from "@/app/(generic)/login/action";
import GoogleLogo from "@/components/icons/GoogleLogo";
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
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useActionState, useEffect, useState } from "react";

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "login";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [submitted, setSubmitted] = useState(false);
  const [state, action, isPending] = useActionState(signup, {});

  // Set the initial tab to look at based on route
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleSignUpSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setSubmitted(true);
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    const validationResult = signUpFormSchema.safeParse(data);
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
        <h1 className="text-2xl font-bold">
          {activeTab === "login" ? "Welcome Back!" : "Get Started Here!"}
        </h1>
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

            {/* Login Page */}
            <TabsContent value="login" className="pt-3">
              <form>
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
                  <Button
                    className="my-5 w-full cursor-pointer"
                    formAction={login}
                  >
                    Sign In
                  </Button>
                </div>
              </form>

              {/* Split for SSO */}
              <div className="relative">
                <div className="flex absolute inset-0 items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="flex relative justify-center">
                  <span className="px-4 pb-1 text-sm text-gray-500 bg-gradient-to-b from-white to-gray-50">
                    or
                  </span>
                </div>
              </div>

              {/* SSO Buttons */}
              <div className="space-y-3 pt-4">
                <div className="flex justify-center items-center">
                  <Button className="w-full font-medium text-accent-foreground bg-background rounded-lg border border-gray-200 transition-all hover:bg-gray-50 cursor-pointer">
                    <GoogleLogo />
                    Continue with Google
                  </Button>
                </div>
              </div>

              {/* Forgot Password + New User */}
              <div className="flex justify-center items-center pt-8">
                <Link href="/">
                  <p className="text-muted-foreground text-sm">
                    Forgot Password?
                  </p>
                </Link>
              </div>
              <div className="flex justify-center items-center pt-8">
                <Link href="/login?tab=sign-up">
                  <p className="text-muted-foreground text-sm">
                    New user? Sign up here
                  </p>
                </Link>
              </div>
            </TabsContent>

            {/* Sign-Up Page */}
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
                  <Button className="my-5 w-full cursor-pointer" type="submit">
                    Register
                  </Button>
                </div>
              </form>

              {/* Split for SSO */}
              <div className="relative">
                <div className="flex absolute inset-0 items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="flex relative justify-center">
                  <span className="px-4 pb-1 text-sm text-gray-500 bg-gradient-to-b from-white to-gray-50">
                    or
                  </span>
                </div>
              </div>

              {/* SSO Buttons */}
              <div className="space-y-3 pt-4">
                <div className="flex justify-center items-center">
                  <Button className="w-full font-medium text-accent-foreground bg-background rounded-lg border border-gray-200 transition-all hover:bg-gray-50 cursor-pointer">
                    <GoogleLogo />
                    Sign Up with Google
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Page;

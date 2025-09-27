import EmailIcon from "@/components/icons/EmailIcon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const Page = () => {
  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-background">
      <EmailIcon height={200} className="p-8" />
      <h1 className="text-4xl font-bold text-foreground p-4">
        Please check your email!
      </h1>
      <p className="text-muted-foreground">
        We&apos;ve sent a confirmation to your email. Follow that link to
        complete your sign-up
      </p>
      <Button className="m-8">
        <Link href="/">Return to Homepage</Link>
      </Button>
    </div>
  );
};

export default Page;

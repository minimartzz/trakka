// TODO: Make a nicer error page
import ErrorIcon from "@/components/icons/ErrorIcon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const Page = () => {
  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-background">
      <ErrorIcon height={200} className="p-8" />
      <h1 className="text-4xl font-bold text-foreground p-4">
        Something went wrong...
      </h1>
      <p className="text-muted-foreground">
        We apologise for the inconvenience caused, please return to the Homepage
        and try again
      </p>
      <Button className="m-8">
        <Link href="/">Return to Homepage</Link>
      </Button>
    </div>
  );
};

export default Page;

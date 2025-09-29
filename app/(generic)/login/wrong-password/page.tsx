import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Page = () => {
  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-background">
      <Image
        src="/wrong-password.png"
        alt="wrong password"
        width={200}
        height={200}
      />
      <h1 className="text-4xl font-bold text-foreground p-4 text-center">
        Wrong Email or Password
      </h1>
      <p className="text-muted-foreground text-center">
        Please ensure that you have keyed in the right email and password
      </p>
      <Button className="m-8">
        <Link href="/login">Return to Login Page</Link>
      </Button>
    </div>
  );
};

export default Page;

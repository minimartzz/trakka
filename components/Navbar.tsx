"use client";

import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import fullLogoLight from "@/public/trakka_full.png";
import fullLogoDark from "@/public/trakka_full_dark.png";
import smallLogoLight from "@/public/trakka_logo.png";
import smallLogoDark from "@/public/trakka_logo_dark.png";
import Link from "next/link";
import createClient from "@/utils/supabase/client";

const Navbar = () => {
  const [scrolling, setScrolling] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolling(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkSignedIn = async () => {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setIsSignedIn(Boolean(authUser));
    };

    checkSignedIn();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className={cn(
          "transition-all duration-300",
          scrolling
            ? "border-b border-border/60 bg-background/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" aria-label="Trakka home" className="shrink-0">
            {/* Full logo — light mode */}
            <Image
              src={fullLogoLight}
              alt="Trakka"
              height={36}
              className="hidden sm:block dark:hidden"
              priority
            />
            {/* Full logo — dark mode */}
            <Image
              src={fullLogoDark}
              alt="Trakka"
              height={36}
              className="hidden dark:sm:block"
              priority
            />
            {/* Small logo — light mode */}
            <Image
              src={smallLogoLight}
              alt="Trakka"
              height={32}
              width={32}
              className="block sm:hidden dark:hidden"
              priority
            />
            {/* Small logo — dark mode */}
            <Image
              src={smallLogoDark}
              alt="Trakka"
              height={32}
              width={32}
              className="hidden dark:block dark:sm:hidden"
              priority
            />
          </Link>

          {isSignedIn ? (
            <Button asChild>
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                asChild
                variant="ghost"
                className="text-foreground/80 hover:text-foreground"
              >
                <Link href="/login?tab=login">Log in</Link>
              </Button>
              <Button
                asChild
                className="shadow-(--shadow-elegant) transition-shadow hover:shadow-(--shadow-glow)"
              >
                <Link href="/login?tab=sign-up">Sign up free</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

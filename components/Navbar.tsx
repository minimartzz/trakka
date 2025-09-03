"use client";
import { Play } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { InteractiveHoverSignUp } from "./magicui/interactive-sign-up";
import Image from "next/image";

const Navbar = () => {
  const [scrolling, setScrolling] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolling(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        scrolling
          ? "border-b border-border/50 bg-background/80 backdrop-blur-sm"
          : ""
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              {/* Icon goes here */}
              {/* <Play className="h-4 w-4 text-primary-foreground" /> */}
              <Image
                src="/trakka_full.png"
                width="600"
                height="200"
                alt="logo"
              />
            </div>
            <span className="text-xl font-bold text-foreground">Trakka</span>
          </div>
          <div className="flex items-center space-x-6">
            <Button className="rounded-full border-black border bg-background text-black font-semibold p-2 px-6 text-center text-base hover:bg-transparent">
              Login
            </Button>
            <InteractiveHoverSignUp>Sign Up</InteractiveHoverSignUp>
            {/* {user ? (
                <Button asChild variant="default">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/auth">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth">Get Started</Link>
                  </Button>
                </>
              )} */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

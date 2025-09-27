"use client";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { InteractiveHoverSignUp } from "./magicui/interactive-sign-up";
import Image from "next/image";
import Logo from "@/public/trakka_full.png";
import darkLogo from "@/public/trakka_full_dark.png";
import smallLogo from "@/public/trakka_logo.png";
import smallDarkLogo from "@/public/trakka_logo_dark.png";
import Link from "next/link";
import createClient from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@/lib/interfaces";

const Navbar = () => {
  const [scrolling, setScrolling] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolling(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if user exists
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();

      // Get the auth user details
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        return;
      }

      // Get profile details
      const { data: profile, error } = await supabase
        .from("profile")
        .select("*")
        .eq("uuid", authUser.id)
        .single();
      if (error || !profile) {
        console.error(error);
        return;
      }

      const authAndProfile = {
        ...profile,
        ...authUser,
      };
      setUser(authAndProfile);
    };

    fetchUser();
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
            {/* <div className="relative w-30 flex items-center justify-center"> */}
            <Link href="/">
              <Image
                src={Logo}
                alt="logo"
                height={40}
                className="hidden dark:hidden sm:block"
              />
              <Image
                src={smallLogo}
                alt="small logo"
                height={35}
                width={35}
                className="dark:hidden sm:hidden justify-self-start"
              />
              <Image
                src={darkLogo}
                alt="logo"
                height={40}
                className="hidden dark:sm:block"
              />
              <Image
                src={smallDarkLogo}
                alt="small logo"
                height={35}
                width={35}
                className="hidden dark:block dark:sm:hidden justify-self-start"
              />
            </Link>
            {/* </div> */}
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <Button asChild variant="default">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login?tab=login">
                  <Button className="rounded-full border-black dark:border-white border bg-white text-black font-semibold p-2 px-6 text-center text-base hover:bg-primary hover:text-white">
                    Login
                  </Button>
                </Link>
                <Link href="/login?tab=sign-up">
                  <InteractiveHoverSignUp>Sign Up</InteractiveHoverSignUp>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

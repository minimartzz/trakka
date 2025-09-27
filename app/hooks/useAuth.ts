"use client";
import React, { useEffect, useState } from "react";
import { User } from "@/lib/interfaces";
import { useRouter } from "next/navigation";
import createClient from "@/utils/supabase/client";
import { toast } from "sonner";

interface UseAuthReturn {
  user: User | null;
  authLoading: boolean;
}

const useAuth = (): UseAuthReturn => {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();

      // Get the auth user details
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
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
        router.push("/onboarding");
        return;
      }

      const authAndProfile = {
        ...authUser,
        ...profile,
      };
      setUser(authAndProfile);
      setAuthLoading(false);
    };

    fetchUser();
  }, [router]);

  return { user, authLoading };
};

export default useAuth;

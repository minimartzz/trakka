"use client";

import LoadingSpinner from "@/components/icons/LoadingSpinner";
import createClient from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AuthRedirect = () => {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (!checking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <LoadingSpinner className="w-10 h-10" />
    </div>
  );
};

export default AuthRedirect;

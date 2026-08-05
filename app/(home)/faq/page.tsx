import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { absoluteUrl } from "@/lib/seo";
import FaqContent from "./FaqContent";

export const metadata: Metadata = {
  title: "FAQ & About",
  description:
    "Answers to common questions about Trakka — what we track, how our statistics work, and how to get started.",
  alternates: { canonical: absoluteUrl("/faq") },
};

// Reading cookies opts this subtree into dynamic rendering. It is isolated in
// its own Suspense boundary so the FAQ body itself still prerenders statically
// for logged-out visitors and crawlers.
const AuthenticatedFaq = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <FaqContent isAuthenticated={Boolean(user)} />;
};

const Page = () => {
  return (
    <main>
      <Suspense fallback={<FaqContent isAuthenticated={false} />}>
        <AuthenticatedFaq />
      </Suspense>
    </main>
  );
};

export default Page;

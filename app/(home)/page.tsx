import { Suspense } from "react";
import AuthRedirect from "@/components/landing/auth-redirect";
import Creators from "@/components/landing/creators";
import Features from "@/components/landing/features";
import FinalCta from "@/components/landing/final-cta";
import Hero from "@/components/landing/hero";
import ProfileDemoServer from "@/components/landing/profile-demo-server";
import ResultsTickerServer from "@/components/landing/ticker-server";

const Index = () => {
  return (
    <>
      <AuthRedirect />
      <main className="overflow-x-clip">
        <Hero />
        <ResultsTickerServer />
        <Features />
        <section className="border-y border-border bg-card/50 px-4 py-24 sm:py-32">
          <div className="container mx-auto">
            <Suspense
              fallback={
                <div className="mx-auto mt-10 h-112 max-w-4xl animate-pulse rounded-xl border border-border bg-card" />
              }
            >
              <ProfileDemoServer />
            </Suspense>
          </div>
        </section>
        <Creators />
        <FinalCta />
      </main>
    </>
  );
};

export default Index;

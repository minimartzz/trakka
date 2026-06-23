import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const FinalCta = () => (
  <section className="px-4 pb-24">
    <div className="container mx-auto">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl bg-[oklch(38%_0.145_262.39)] px-6 py-16 text-center shadow-(--shadow-glow) sm:py-20">
        {/* Faint scoreboard grid inside the panel */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(oklch(100%_0_0/0.05)_1px,transparent_1px),linear-gradient(90deg,oklch(100%_0_0/0.05)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_80%_90%_at_50%_0%,black,transparent)]"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-balance font-bold uppercase leading-none text-white text-[clamp(2.25rem,5.5vw,3.75rem)]">
            Make the next game count
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-white/85 sm:text-lg">
            Start your tribe&rsquo;s record tonight: log the first session
            before the box is back on the shelf.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 bg-white px-8 text-base text-[oklch(30%_0.12_262.39)] hover:bg-white/90"
          >
            <Link href="/login?tab=sign-up">
              Sign up free
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default FinalCta;

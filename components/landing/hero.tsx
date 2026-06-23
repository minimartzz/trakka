"use client";

import { Button } from "@/components/ui/button";
import { BrowserFrame, PhoneFrame } from "@/components/landing/frames";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const WORDS = ["Record", "Log", "Save", "Enter", "Track", "Store", "Note"];

const TAGLINES = [
  "Can't blame that loss on luck anymore.",
  "So you said you were the best at Dune: Imperium?",
  "Your win rate doesn't lie. Unfortunately.",
  "The stats remember what you choose to forget.",
  "Stop guessing who's best at game night. Start knowing.",
  "Prove it wasn't a fluke. Again. And again.",
];

const Hero = () => {
  const [index, setIndex] = useState(0);
  const [tagline, setTagline] = useState(TAGLINES[0]);

  useEffect(() => {
    setTagline(TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden px-4 pt-36">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(var(--color-border)/0.6_1px,transparent_1px),linear-gradient(90deg,var(--color-border)/0.6_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-105 bg-[radial-gradient(ellipse_60%_55%_at_50%_-12%,var(--color-primary)/0.15,transparent)]"
      />

      <div className="container mx-auto">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display font-bold uppercase leading-[0.95] tracking-[-0.01em] text-[clamp(3rem,9vw,5.75rem)]">
            <span className="inline-flex items-baseline justify-center gap-[0.22em] flex-wrap">
              {/* Rotating word — fixed width so the rest of the line doesn't shift */}
              <span
                className="relative inline-block overflow-hidden"
                style={{ minWidth: "4ch" }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={WORDS[index]}
                    className="inline-block"
                    initial={{ opacity: 0, y: "-55%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "55%" }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {WORDS[index]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span>it in your</span>
              <span className="text-primary">Trakka</span>
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-pretty text-xl font-semibold text-foreground sm:text-2xl">
            &ldquo;{tagline}&rdquo;
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 px-7 text-base shadow-(--shadow-elegant) transition-shadow hover:shadow-(--shadow-glow)"
            >
              <Link href="/login?tab=sign-up">
                Start your tribe
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base"
            >
              <Link href="#features">See what gets tracked</Link>
            </Button>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Free to use. No credit card required.
          </p>
        </div>

        <div className="relative mx-auto mt-20 mb-10 w-full max-w-5xl px-4 sm:px-6">
          <div
            aria-hidden
            className="absolute inset-x-0 top-1/4 -z-10 mx-auto h-72 max-w-3xl rounded-full bg-primary/15 blur-3xl"
          />
          {/* Mobile: phone only, full width */}
          <div className="relative sm:hidden">
            <PhoneFrame
              label="Replace with mobile screenshot"
              className="mx-auto w-full max-w-xs"
            />
          </div>

          {/* Desktop: browser + phone overlay */}
          <div className="relative hidden sm:flex sm:items-start">
            <BrowserFrame
              label="Replace with dashboard screenshot"
              className="w-9/10"
            />
            <div className="absolute right-0 top-[15%] w-[28%]">
              <PhoneFrame label="Replace with mobile screenshot" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

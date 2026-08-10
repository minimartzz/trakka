"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ExternalLink, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { QUESTIONS, type AnswerBlock, type Question } from "./questions";

const AnswerBody = ({ blocks }: { blocks: AnswerBlock[] }) => {
  if (blocks.length === 0) {
    return (
      <p className="text-base italic leading-relaxed text-muted-foreground">
        We're still writing this one. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "text":
            return (
              <p
                key={i}
                className="text-base leading-[1.65] text-muted-foreground text-pretty"
              >
                {block.body}
              </p>
            );
          case "steps":
            return (
              <ol key={i} className="space-y-3.5">
                {block.items.map((item, n) => (
                  <li
                    key={item.lead}
                    className="grid grid-cols-[1.5rem_1fr] gap-x-1"
                  >
                    <span
                      aria-hidden="true"
                      className="text-base font-semibold leading-[1.65] text-muted-foreground"
                    >
                      {n + 1}.
                    </span>
                    <p className="text-base leading-[1.65] text-muted-foreground text-pretty">
                      <strong className="font-semibold text-foreground">
                        {item.lead}.
                      </strong>{" "}
                      {item.body}
                    </p>
                  </li>
                ))}
              </ol>
            );
          case "bullets":
            return (
              <ul key={i} className="space-y-1.5">
                {block.items.map((item, n) => (
                  <li key={n} className="grid grid-cols-[1.5rem_1fr] gap-x-1">
                    <span
                      aria-hidden="true"
                      className="text-base leading-[1.65] text-muted-foreground"
                    >
                      &bull;
                    </span>
                    <p className="text-base leading-[1.65] text-muted-foreground text-pretty">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            );
        }
      })}
    </div>
  );
};

const FAQItem = ({ qns, ans }: Question) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="group flex w-full items-start justify-between gap-6 py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-sm"
        >
          <span
            className={`font-heading text-lg font-semibold leading-snug text-pretty transition-colors group-hover:text-primary ${
              open ? "text-primary" : "text-foreground"
            }`}
          >
            {qns}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-1 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            aria-hidden="true"
          >
            <ChevronDown className="h-4.5 w-4.5" />
          </motion.span>
        </button>
      </h3>

      {/* Answers are always mounted but are hidden through collapsed height.
          Ensures that crawlers can see the index markup for SEO */}
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ overflow: "hidden" }}
        inert={!open}
      >
        <div className="pb-6 pr-10">
          <AnswerBody blocks={ans} />
        </div>
      </motion.div>
    </div>
  );
};

const FaqContent = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <div className="px-4 pt-24 pb-8 sm:px-8 sm:pt-32 sm:pb-12 mb-10">
      <div className="mx-auto max-w-2xl">
        {isAuthenticated && (
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex-col flex-center gap-y-6 mb-10">
          <h1 className="font-heading text-2xl sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-lg">
            Questions about Trakka. Answered.
          </p>
        </div>

        <div className="border-t border-border">
          {QUESTIONS.map((q) => (
            <FAQItem key={q.qns} qns={q.qns} ans={q.ans} />
          ))}
        </div>
      </div>

      {/* About Us */}
      <div className="mx-auto max-w-3xl mt-15">
        <h2 className="flex-center mb-5 font-heading text-2xl sm:text-5xl">
          About Us
        </h2>
        <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed p-3">
          <p>
            Hello! We're John and Martin, a team of board game fans with a
            passion &lpar;maybe obsession&rpar; with performance. Trakka started
            as a side project to rank our skill level and compare performance
            across different games. Originally stored in a spreadsheet, we
            wanted something that felt less like bookkeeping and more like a
            scoreboard.
          </p>
          <p>
            Hence, the creation of Trakka! It is built for the nerdy with an
            emphasis on tribe performance so you can compare your own skill
            level with friends in your groups. That way you can definitively
            claim you are the best at Dune: Imperium and that most recent loss
            was really just because you were unlucky.
          </p>
          <p>
            Trakka is actively developed. We aim to ship biweekly, but things
            might still break along the way. With full time jobs that might be
            difficult, but we hope you will record your scores in your Trakka!
          </p>
          <Link
            href="https://github.com/minimartzz/trakka/blob/main/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            View changelog
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FaqContent;

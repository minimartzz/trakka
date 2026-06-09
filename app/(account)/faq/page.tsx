"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Question {
  qns: string;
  ans: string;
}

const QUESTIONS: Question[] = [
  {
    qns: "What is Trakka?",
    ans: "Placeholder",
  },
  {
    qns: "Why choose Trakka?",
    ans: "Placeholder",
  },
  {
    qns: "What statistics do we track?",
    ans: "Placeholder",
  },
  {
    qns: "How to get started?",
    ans: "Placeholder",
  },
  {
    qns: "What do our statistics represent?",
    ans: "Placeholder",
  },
  {
    qns: "How often do we release updates?",
    ans: "Placeholder",
  },
];

const FAQItem = ({ qns, ans }: Question) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-xl"
      >
        <span className="font-heading text-base font-semibold leading-snug sm:text-lg">
          {qns}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-0.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground sm:text-base max-w-[65ch]">
              {ans}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Page = () => {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12 mb-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex-col flex-center gap-y-6 mb-10">
          <h1 className="font-heading text-2xl sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-lg">
            Questions about Trakka. Answered.
          </p>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-3">
          {QUESTIONS.map((q) => (
            <FAQItem key={q.qns} qns={q.qns} ans={q.ans} />
          ))}
        </div>
      </div>

      {/* About Us */}
      <div className="mx-auto max-w-3xl mt-15">
        <h1 className="flex-center mb-5 font-heading text-2xl sm:text-5xl">
          About Us
        </h1>
        <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed p-3">
          <p>
            Hello! We're John and Martin, a team of board game fans we a passion
            &lpar;maybe obsession&rpar; with performance. Trakka started as a
            side project to rank our skill level and compare performance across
            different games. Originally stored in a spreadsheet, we wanted
            something that felt less like bookkeeping and more like a
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

export default Page;

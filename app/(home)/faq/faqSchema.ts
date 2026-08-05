import { isValidElement, type ReactNode } from "react";
import { QUESTIONS, type AnswerBlock } from "./questions";

/**
 * Flatten a ReactNode answer body to plain text. Answers are authored as JSX
 * (some contain inline <FaqLink>s), but FAQPage schema requires text, and
 * deriving it here keeps the markup in sync with what users actually see —
 * a hand-maintained copy would silently drift.
 */
function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeToText(node.props.children);
  }
  return "";
}

function blocksToText(blocks: AnswerBlock[]): string {
  return (
    blocks
      .map((block) => {
        switch (block.kind) {
          case "text":
            return nodeToText(block.body);
          case "steps":
            return block.items
              .map((item) => `${item.lead}. ${nodeToText(item.body)}`)
              .join(" ");
          case "bullets":
            return block.items.map((item) => `${nodeToText(item)}.`).join(" ");
        }
      })
      .filter(Boolean)
      .join(" ")
      // Collapse whitespace introduced by JSX formatting.
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * FAQPage structured data. Every Q&A here is rendered visibly on /faq (the
 * accordion collapses answers with CSS but never unmounts them), which is
 * Google's requirement for FAQ rich result eligibility.
 */
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: QUESTIONS.map((q) => ({
    "@type": "Question",
    name: q.qns,
    acceptedAnswer: {
      "@type": "Answer",
      text: blocksToText(q.ans),
    },
  })),
};

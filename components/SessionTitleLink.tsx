import Link from "next/link";
import { sessionHref } from "@/hooks/use-row-link";

// A session list's game title as the link to its session page. The row around
// it opens the same page on click (useRowLink); this is the keyboard and
// new-tab route there.
export default function SessionTitleLink({
  sessionId,
  gameTitle,
}: {
  sessionId: string;
  gameTitle: string;
}) {
  return (
    <Link
      href={sessionHref(sessionId)}
      className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {gameTitle}
    </Link>
  );
}

import { cn } from "@/lib/utils";

// The session's notes. Co-op sessions give them more weight, since the story
// of the run is most of what there is to tell.
export default function SessionDescription({
  description,
  prominent = false,
}: {
  description: string;
  prominent?: boolean;
}) {
  return (
    <section
      aria-labelledby="notes-heading"
      className="rounded-lg border bg-card p-5"
    >
      <h2
        id="notes-heading"
        className={cn("font-semibold", prominent ? "text-xl" : "text-base")}
      >
        Notes
      </h2>
      <p
        className={cn(
          "mt-2 max-w-[70ch] whitespace-pre-line",
          prominent ? "text-lg leading-relaxed" : "text-muted-foreground",
        )}
      >
        {description}
      </p>
    </section>
  );
}

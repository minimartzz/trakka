import { PostHog } from "posthog-node";
import { after } from "next/server";

let posthogServer: PostHog | null = null;

// Server-side client for error capture. flushAt/flushInterval send each event
// right away, because serverless functions can freeze before a batch flushes.
export function getPostHogServer() {
  if (!posthogServer) {
    posthogServer = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!,
      {
        host: "https://us.i.posthog.com",
        flushAt: 1,
        flushInterval: 0,
      },
    );
  }
  return posthogServer;
}

// For errors a server action catches itself; onRequestError never sees them.
// Sends after the response, so the user isn't kept waiting on PostHog.
export function reportServerError(
  error: unknown,
  distinctId?: string,
  properties?: Record<string, unknown>,
) {
  if (process.env.VERCEL_ENV !== "production") return;

  after(() =>
    getPostHogServer().captureExceptionImmediate(error, distinctId, properties),
  );
}

import posthog from "posthog-js";

const posthogProjectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
// Reverse proxy (rewrites in next.config.ts) so blockers don't drop events
const posthogHost = "/ingest";

if (posthogProjectToken && posthogHost) {
  posthog.init(posthogProjectToken, {
    api_host: posthogHost,
    // Toolbar and replay links still open the real PostHog app
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    // Errors are only reported from production deployments. Previews and
    // local dev still send analytics events.
    before_send: (event) =>
      event?.event === "$exception" &&
      process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"
        ? null
        : event,
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  throw new Error(
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}

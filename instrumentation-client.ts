import posthog from "posthog-js";

const posthogProjectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = "https://us.i.posthog.com";

if (posthogProjectToken && posthogHost) {
  posthog.init(posthogProjectToken, {
    api_host: posthogHost,
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
  const missingVariable = posthogProjectToken
    ? "https://us.i.posthog.com"
    : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";

  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

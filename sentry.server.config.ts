// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://1793c4e46d5642936b640d1902dfe899@o4509785292079104.ingest.us.sentry.io/4511347401818112",
  environment: process.env.NODE_ENV,
  // For Logs
  integrations: [
    // send console.warn and console.error calls as logs to Sentry. console.log is
    // excluded — shipping every informational log was pure egress for no signal.
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],

  // Sampled at 10% in production; see instrumentation-client.ts for the rationale.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.VERCEL_ENV !== "production"
  ) {
    return;
  }

  const { getPostHogServer } = await import("./lib/posthog-server");

  // captureExceptionImmediate (not captureException) returns a promise that
  // resolves once the event is sent; the plain version can be lost on Vercel.
  await getPostHogServer().captureExceptionImmediate(
    err,
    getDistinctId(request.headers.cookie),
    {
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  );
};

// Links the server error to the same person PostHog tracks in the browser.
function getDistinctId(cookie: string | string[] | undefined) {
  const cookies = Array.isArray(cookie) ? cookie.join("; ") : (cookie ?? "");
  const match = cookies.match(/ph_phc_.*?_posthog=([^;]+)/);
  if (!match) return undefined;
  try {
    return JSON.parse(decodeURIComponent(match[1])).distinct_id as string;
  } catch {
    return undefined;
  }
}

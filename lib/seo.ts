/**
 * Central SEO config. NEXT_PUBLIC_BASE_URL is the production origin (no
 * trailing slash). Every canonical, OG image, and sitemap URL is derived from it.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trakka.co";

export const SITE_NAME = "Trakka";

/** Used as the OG/Twitter default and the homepage description. */
export const SITE_DESCRIPTION =
  "Trakka is a free board game tracker for groups. Log every session, track win rates and head-to-head records, and rank players with a single cross-game rating.";

/** Absolute URL helper — schema and metadata both require absolute URLs. */
export const absoluteUrl = (path = "/") => new URL(path, SITE_URL).toString();

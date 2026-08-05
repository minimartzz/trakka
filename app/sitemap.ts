import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Only publicly-crawlable routes belong here. Authenticated surfaces
 * (dashboard, tribe, session, account) are per-user and gated, so they are
 * deliberately excluded and disallowed in robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/faq`,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

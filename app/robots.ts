import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard",
          "/account",
          "/tribe/",
          "/session",
          "/recent-games",
          "/onboarding",
          "/join/",
          "/monitoring",
          "/reset-password",
          "/update-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

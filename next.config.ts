import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL("https://cf.geekdo-images.com/**")],
  },
};

export default nextConfig;

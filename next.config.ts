import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Hide the Next.js development issue counter. Errors stay in the browser console.
  devIndicators: false,
};

export default nextConfig;

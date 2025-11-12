import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use the updated serverExternalPackages instead of deprecated experimental option
  serverExternalPackages: [],
  // Suppress hydration warnings for browser extension attributes
  reactStrictMode: false,
  // Handle browser extension hydration issues
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;

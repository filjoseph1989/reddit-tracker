import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Also allow other devices on the local network (e.g. http://192.168.1.21:3006).
  allowedDevOrigins: ["reddit-tracker.test", "192.168.1.*"],
  experimental: {
    serverActions: {
      allowedOrigins: ["reddit-tracker.test"],
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

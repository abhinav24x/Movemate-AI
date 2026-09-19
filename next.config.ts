import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode for better React development
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // API body size limit for audio uploads (25MB + overhead)
  experimental: {
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },
};

export default nextConfig;

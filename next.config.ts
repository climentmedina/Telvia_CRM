import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images from company websites
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;

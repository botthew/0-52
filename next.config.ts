import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // WebP only. AVIF is smaller but slow to encode on the shared Fly CPU.
    formats: ["image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1200, 1600],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.fly.storage.tigris.dev",
        pathname: "/posts/**",
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lets a production build run beside `next dev` (NEXT_DIST_DIR=.next-build npm run build)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  experimental: { optimizePackageImports: ["motion", "gsap"] },
  async headers() {
    return [
      {
        source: "/:dir(frames|stills|gallery)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;

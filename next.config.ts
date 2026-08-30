import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  trailingSlash: true,
  basePath: "/Highlight",
  images: { unoptimized: true },
};

export default nextConfig;

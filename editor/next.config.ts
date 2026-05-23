import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["express", "@genkit-ai/core", "genkit"],
};

export default nextConfig;

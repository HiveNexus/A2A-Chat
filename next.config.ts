import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.IS_DOCKER === 'true' ? 'standalone' : undefined,
};

export default nextConfig;

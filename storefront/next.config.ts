import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server build for the production Docker image.
  output: "standalone",
  // API calls are proxied to the backend at runtime by
  // app/api/[...path]/route.ts (reads API_URL per request), so nothing
  // environment-specific is baked into this build.
};

export default nextConfig;

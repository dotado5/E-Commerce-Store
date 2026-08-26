import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server build for the production Docker image.
  output: "standalone",
  env: {
    // Expose the Stripe publishable key (set as NEXT_STRIPE_PK in .env)
    // to the browser bundle.
    NEXT_PUBLIC_STRIPE_PK: process.env.NEXT_STRIPE_PK ?? "",
  },
  async rewrites() {
    // Proxy API calls to the NestJS backend so the browser stays
    // same-origin (no CORS needed). Mirrors the nginx proxy in prod.
    const apiUrl = process.env.API_URL ?? "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

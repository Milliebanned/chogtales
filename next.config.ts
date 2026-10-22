import type { NextConfig } from "next";

// Optional deps pulled in by wallet connectors that we never use.
const STUBBED = [
  "@base-org/account",
  "@coinbase/cdp-sdk",
  "pino-pretty",
  "lokijs",
  "encoding",
];

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // the paid Library art is read from disk by this route, so ship it with the function
  outputFileTracingIncludes: { "/api/library/art": ["./library-private/**/*"] },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...Object.fromEntries(STUBBED.map((m) => [m, false])),
    };
    return config;
  },
};

export default nextConfig;

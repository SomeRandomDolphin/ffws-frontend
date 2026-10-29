import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig = (phase: string): NextConfig => ({
  output: phase === PHASE_DEVELOPMENT_SERVER ? undefined : "export",
  ...(phase === PHASE_DEVELOPMENT_SERVER ? {
    async rewrites() {
      return [{
        source: "/monitoring-api/:path*",
        destination: `${process.env.MONITORING_API_ORIGIN ?? "http://127.0.0.1:8000"}/:path*`,
      }];
    },
  } : {}),
  devIndicators: false,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
});

export default nextConfig;

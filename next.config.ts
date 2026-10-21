import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

function resolveBasePath(value: string): string {
  const pathname = /^https?:\/\//i.test(value) ? new URL(value).pathname : value;
  const segment = pathname.replace(/^\/+|\/+$/g, "");
  return segment ? `/${segment}` : "";
}

const basePath = resolveBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");

const nextConfig = (phase: string): NextConfig => ({
  basePath,
  output: phase === PHASE_DEVELOPMENT_SERVER ? undefined : "export",
  devIndicators: false,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
});

export default nextConfig;

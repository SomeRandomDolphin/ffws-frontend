function resolveBasePath(value: string): string {
  const pathname = /^https?:\/\//i.test(value) ? new URL(value).pathname : value;
  const segment = pathname.replace(/^\/+|\/+$/g, "");
  return segment ? `/${segment}` : "";
}

export const basePath = resolveBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");

// Prefix bundled public assets; Next.js only applies basePath to its own routes.
export function withBasePath(path: string): string {
  if (!basePath || /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(path)) return path;
  return `${basePath}/${path.replace(/^\/+/, "")}`;
}

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat, realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../out");
const args = process.argv.slice(2);
function option(name, fallback) {
  const assigned = args.find(arg => arg.startsWith(`${name}=`));
  if (assigned) return assigned.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}
const port = Number(option("--port", process.env.PORT ?? "3000"));
const host = option("--host", "127.0.0.1");
if (!Number.isInteger(port) || port < 1 || port > 65535 || !host) {
  throw new Error("Use --port 1..65535 and --host ADDRESS.");
}
try { await stat(resolve(root, "index.html")); }
catch { throw new Error("Static export is missing. Run npm run build before npm start."); }

const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json",
  ".geojson": "application/geo+json", ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".wasm": "application/wasm",
};
function inside(path) {
  const part = relative(root, path);
  return part !== ".." && !part.startsWith(`..${sep}`) && !isAbsolute(part);
}
async function exportedFile(path) {
  const candidate = resolve(root, `.${path}`);
  if (!inside(candidate)) return null;
  // HTML routes take priority over App Router payload directories with the same name.
  for (const file of [`${candidate}.html`, candidate, resolve(candidate, "index.html")]) {
    try {
      const canonical = await realpath(file);
      if (inside(canonical) && (await stat(canonical)).isFile()) return canonical;
    } catch { /* Try the next exported filename. */ }
  }
  return null;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let path;
  try { path = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400).end(); return; }
  try {
    const found = await exportedFile(path);
    const file = found ?? resolve(root, "404.html");
    const info = await stat(file);
    response.writeHead(found ? 200 : 404, {
      "Content-Type": mime[extname(file)] ?? "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).on("error", () => response.destroy()).pipe(response);
  } catch { response.writeHead(404).end(); }
});
server.on("error", error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, host, () => console.log(`Static frontend: http://${host}:${port}`));

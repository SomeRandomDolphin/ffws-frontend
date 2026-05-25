const http = require("http");
const fs = require("fs");
const path = require("path");

const basename = process.env.PUBLIC_URL || "/tsipil/informasibanjir/ffws";
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const root = path.resolve(__dirname, "..", "build");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, body) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type":
        contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    res.end(body);
  });
}

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);

  if (pathname !== basename && !pathname.startsWith(`${basename}/`)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Open ${basename}/`);
    return;
  }

  const relativePath = pathname.slice(basename.length).replace(/^\//, "");
  const requestedPath = relativePath || "index.html";
  let filePath = path.resolve(root, requestedPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (error || stat.isDirectory()) {
      filePath = path.join(root, "index.html");
    }

    sendFile(res, filePath);
  });
});

server.listen(port, host, () => {
  console.log(`Serving build at http://${host}:${port}${basename}/`);
});

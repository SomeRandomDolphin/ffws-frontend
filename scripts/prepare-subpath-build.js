const fs = require("fs");
const path = require("path");

const basename = process.env.PUBLIC_URL || "/tsipil/informasibanjir/ffws";
const root = path.resolve(__dirname, "..", "build");
const target = path.join(root, ...basename.split("/").filter(Boolean));

if (!fs.existsSync(root)) {
  console.error("Build directory does not exist. Run npm run build first.");
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.name === basename.split("/").filter(Boolean)[0]) {
    continue;
  }

  const sourcePath = path.join(root, entry.name);
  const targetPath = path.join(target, entry.name);

  if (entry.isDirectory()) {
    if (entry.name === "static") {
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    }
    continue;
  }

  if (entry.isFile()) {
    fs.copyFileSync(sourcePath, targetPath);
  }
}

console.log(`Prepared local subpath build at build${basename}`);

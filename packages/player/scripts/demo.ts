/**
 * Static demo server: serves dist/faststream-web at /player/ and demo/ at /.
 * Run `bun scripts/build-player.ts` first so the player assets exist.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const demoDir = join(pkgRoot, "demo");
const playerDir = join(pkgRoot, "dist/faststream-web");
const PORT = 4321;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
  ".mpd": "application/dash+xml",
};

function safeJoin(root: string, urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split("?")[0] ?? urlPath);
  const full = normalize(resolve(root, "." + decoded));
  if (!full.startsWith(resolve(root))) return null;
  return full;
}

function sendFile(
  res: import("node:http").ServerResponse,
  filePath: string,
): void {
  const data = readFileSync(filePath);
  const type = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  res.end(data);
}

if (!existsSync(join(playerDir, "player/index.html"))) {
  console.error(
    "Missing dist/faststream-web/player/index.html — run: bun scripts/build-player.ts",
  );
  process.exit(1);
}

const server = createServer((req, res) => {
  const url = req.url ?? "/";
  try {
    if (url === "/" || url.startsWith("/demo") || url.startsWith("/index")) {
      const rel =
        url === "/" || url.startsWith("/?")
          ? "/index.html"
          : url.replace(/^\/demo/, "") || "/index.html";
      const file = safeJoin(demoDir, rel === "/" ? "/index.html" : rel);
      if (!file || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end("Not found");
        return;
      }
      sendFile(res, file);
      return;
    }

    if (url.startsWith("/player/")) {
      const rel = url.slice("/player".length) || "/";
      let file = safeJoin(playerDir, rel);
      if (file && existsSync(file) && statSync(file).isDirectory()) {
        file = join(file, "index.html");
      }
      if (!file || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end("Not found");
        return;
      }
      sendFile(res, file);
      return;
    }

    // Allow demo page to import @bili/player sources for feedPlayer / ACCELERATED_DASH
    if (url.startsWith("/pkg/")) {
      const rel = url.slice("/pkg".length);
      const file = safeJoin(pkgRoot, rel);
      if (!file || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end("Not found");
        return;
      }
      sendFile(res, file);
      return;
    }

    if (url.startsWith("/types/")) {
      const typesRoot = join(pkgRoot, "../types");
      const rel = url.slice("/types".length);
      const file = safeJoin(typesRoot, rel);
      if (!file || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end("Not found");
        return;
      }
      sendFile(res, file);
      return;
    }

    res.writeHead(404).end("Not found");
  } catch (err) {
    console.error(err);
    res.writeHead(500).end("Internal error");
  }
});

server.listen(PORT, () => {
  console.log(`Demo:   http://localhost:${PORT}/`);
  console.log(`Player: http://localhost:${PORT}/player/player/index.html`);
});

/**
 * Local development server — NOT used in production.
 *
 * On Vercel, /public is served as static files and /api/*.js files become
 * serverless functions automatically. This script just emulates that
 * locally (static file serving + wiring up /api/reserve.js) using only
 * Node's built-in http module, so there are zero npm dependencies.
 *
 * Run with: node dev-server.js
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 5173;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function augmentResponse(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (obj) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
  };
  return res;
}

async function serveStatic(req, res, pathname) {
  let filePath = path.join(PUBLIC_DIR, decodeURIComponent(pathname));
  if (pathname === "/") filePath = path.join(PUBLIC_DIR, "index.html");

  // prevent path traversal outside /public
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  augmentResponse(res);

  if (url.pathname === "/api/reserve") {
    try {
      req.body = await readJsonBody(req);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    const handler = require("./api/reserve.js");
    return handler(req, res);
  }

  return serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`\nTAVARÉ dev server running at http://localhost:${PORT}`);
  console.log(`(This is local-dev only — production runs on Vercel. See SETUP.md.)\n`);
});

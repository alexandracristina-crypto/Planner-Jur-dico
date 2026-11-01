// Zero-dependency dev server for the single-file Planner Jurídico app.
// Serves the current version of the app at "/" so the preview lands on it,
// and reloads the page automatically whenever the HTML file is saved.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
// Newest version of the planner. The other .html files are older versions kept
// in the repo for reference only.
const APP_FILE = process.env.APP_FILE || "planner_juridico (1).html";
const PORT = Number(process.env.PORT || 3000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
};

const RELOAD_SNIPPET = `<script>
  try {
    new EventSource("/__reload").onmessage = () => location.reload();
  } catch (e) {}
</script>`;

/** @type {Set<import("node:http").ServerResponse>} */
const clients = new Set();

// Bind mounts do not always deliver fs.watch events, so poll the mtime.
const appPath = join(ROOT, APP_FILE);
let lastMtime = 0;
stat(appPath)
  .then((s) => (lastMtime = s.mtimeMs))
  .catch(() => {});

setInterval(async () => {
  try {
    const s = await stat(appPath);
    if (s.mtimeMs !== lastMtime) {
      lastMtime = s.mtimeMs;
      for (const res of clients) res.write("data: reload\n\n");
    }
  } catch {
    /* file momentarily missing while saving */
  }
}, 1000).unref();

function injectReload(html) {
  const i = html.lastIndexOf("</body>");
  return i === -1 ? html + RELOAD_SNIPPET : html.slice(0, i) + RELOAD_SNIPPET + html.slice(i);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/" || pathname === "/index.html") pathname = "/" + APP_FILE;

  const file = normalize(join(ROOT, pathname));
  if (!file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  try {
    let body = await readFile(file);
    const type = TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
    if (type.startsWith("text/html")) body = Buffer.from(injectReload(body.toString("utf8")));
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" }).end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Planner Jurídico on http://0.0.0.0:${PORT} (serving ${APP_FILE})`);
});

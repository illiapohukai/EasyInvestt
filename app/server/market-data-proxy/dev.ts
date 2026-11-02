/**
 * Local development server for the market-data proxy (Node ≥ 22.18, runs TypeScript directly).
 *
 *   TWELVE_DATA_API_KEY=… ALLOWED_ORIGINS=http://localhost:3000 npm run proxy:dev
 *
 * Then start the app with VITE_MARKET_DATA_API_URL=http://localhost:8787.
 * Never commit the key; put it in .dev.vars or your shell only.
 */
import { createServer } from "node:http";
import { createProxy } from "./handler.ts";

const port = Number(process.env["PORT"] ?? 8787);
const handle = createProxy({
  env: {
    ...(process.env["TWELVE_DATA_API_KEY"]
      ? { TWELVE_DATA_API_KEY: process.env["TWELVE_DATA_API_KEY"] }
      : {}),
    ALLOWED_ORIGINS:
      process.env["ALLOWED_ORIGINS"] ?? "http://localhost:3000,http://localhost:5173",
    ...(process.env["OPEN_MARKET_STATUS"]
      ? { OPEN_MARKET_STATUS: process.env["OPEN_MARKET_STATUS"] }
      : {}),
    ...(process.env["UPSTREAM_CALLS_PER_MINUTE"]
      ? { UPSTREAM_CALLS_PER_MINUTE: process.env["UPSTREAM_CALLS_PER_MINUTE"] }
      : {}),
  },
});

createServer(async (req, res) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
  }
  const response = await handle(
    new Request(`http://localhost:${port}${req.url ?? "/"}`, {
      method: req.method ?? "GET",
      headers,
    }),
  );
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  res.end(await response.text());
}).listen(port, () => {
  console.log(
    `Kurs-Proxy läuft auf http://localhost:${port} (Schlüssel ${process.env["TWELVE_DATA_API_KEY"] ? "gesetzt" : "FEHLT"})`,
  );
});

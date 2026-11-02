/**
 * Cloudflare Workers entry point for the market-data proxy.
 *
 *   npx wrangler secret put TWELVE_DATA_API_KEY
 *   npx wrangler deploy server/market-data-proxy/worker.ts --name geldstart-kurse \
 *     --var ALLOWED_ORIGINS:https://<user>.github.io
 *
 * The cache lives in the memory of one worker instance; that is enough to
 * keep upstream calls low for a small learning app.
 */
import { createProxy, type ProxyEnv } from "./handler.ts";

let handler: ((request: Request) => Promise<Response>) | null = null;

export default {
  fetch(request: Request, env: ProxyEnv): Promise<Response> {
    handler ??= createProxy({ env });
    return handler(request);
  },
};

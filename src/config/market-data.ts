import { createDemoProvider } from "@/lib/market-data/demo-provider";
import { createHttpProvider } from "@/lib/market-data/http-provider";
import { createMarketDataService, type MarketDataService } from "@/lib/market-data/service";
import type { MarketDataProvider } from "@/lib/market-data/types";

/**
 * Selects the market-data adapter at build time.
 *
 * Without VITE_MARKET_DATA_API_URL the app runs in demo mode with fictional
 * sample data. With it, all requests go to that server-side proxy. There is
 * deliberately no automatic fallback from real data to demo data.
 *
 * Only public values belong here: everything prefixed with VITE_ ends up in
 * the browser bundle. Vendor API keys are configured on the proxy only.
 */

const SECRET_IN_URL = /[?&#](api[_-]?key|apikey|token|secret|key)=/i;

export function resolveProxyUrl(raw: string | undefined): string | null {
  const value = raw?.trim() ?? "";
  if (value === "") return null;
  if (SECRET_IN_URL.test(value)) {
    throw new Error(
      "VITE_MARKET_DATA_API_URL must not contain an API key. Configure the key on the server-side proxy.",
    );
  }
  if (!/^https?:\/\//.test(value)) {
    throw new Error("VITE_MARKET_DATA_API_URL must be an absolute http(s) URL.");
  }
  return value.replace(/\/+$/, "");
}

/** Currencies that the practice portfolio can hold. See README "Währungen". */
export const SUPPORTED_CURRENCIES: readonly string[] = ["EUR"];

function createProvider(): MarketDataProvider {
  const url = resolveProxyUrl(import.meta.env.VITE_MARKET_DATA_API_URL);
  if (!url) return createDemoProvider();
  const name = import.meta.env.VITE_MARKET_DATA_PROVIDER_NAME?.trim() || "Marktdaten-Anbieter";
  const providerUrl = import.meta.env.VITE_MARKET_DATA_PROVIDER_URL?.trim();
  return createHttpProvider({
    baseUrl: url,
    info: { id: "market", name, ...(providerUrl ? { url: providerUrl } : {}) },
  });
}

let service: MarketDataService | null = null;

export function getMarketData(): MarketDataService {
  service ??= createMarketDataService(createProvider());
  return service;
}

/** Test helper: use a specific provider. */
export function __setMarketDataProviderForTests(provider: MarketDataProvider | null) {
  service = provider ? createMarketDataService(provider) : null;
}

import { getMarketData } from "@/config/market-data";
import type { PortfolioRecord } from "@/lib/depot/types";

export const DEMO_LABEL = "Beispieldaten – keine aktuellen Marktdaten";

/** True while the app runs with the built-in sample data. */
export function isDemoMode(): boolean {
  return getMarketData().provider.mode === "demo";
}

/** False when the portfolio was created with another data source. */
export function providerMatches(portfolio: PortfolioRecord): boolean {
  return portfolio.providerId === getMarketData().provider.info.id;
}

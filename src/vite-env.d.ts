/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public URL of the server-side market-data proxy. Unset = demo mode. */
  readonly VITE_MARKET_DATA_API_URL?: string;
  /** Name of the market-data vendor behind the proxy, shown as data source. */
  readonly VITE_MARKET_DATA_PROVIDER_NAME?: string;
  /** Website of the market-data vendor, shown as data source link. */
  readonly VITE_MARKET_DATA_PROVIDER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

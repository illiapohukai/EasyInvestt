export type MarketDataErrorKind =
  | "rate-limit"
  | "provider-error"
  | "offline"
  | "unsupported"
  | "not-found"
  | "invalid-response"
  | "aborted";

export class MarketDataError extends Error {
  readonly kind: MarketDataErrorKind;
  /** Seconds until the provider accepts requests again (rate limits). */
  readonly retryAfterSeconds: number | undefined;

  constructor(kind: MarketDataErrorKind, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "MarketDataError";
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isMarketDataError(error: unknown): error is MarketDataError {
  return error instanceof MarketDataError;
}

/** Converts any thrown value into a MarketDataError. */
export function toMarketDataError(error: unknown): MarketDataError {
  if (error instanceof MarketDataError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new MarketDataError("aborted", "Anfrage abgebrochen.");
  }
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (offline) return new MarketDataError("offline", "Keine Internetverbindung.");
  return new MarketDataError("provider-error", "Der Datenanbieter ist nicht erreichbar.");
}

/** German, user-facing explanation for an error kind. */
export function describeMarketDataError(error: MarketDataError): { title: string; text: string } {
  switch (error.kind) {
    case "rate-limit":
      return {
        title: "Zu viele Anfragen",
        text:
          error.retryAfterSeconds !== undefined
            ? `Der Datenanbieter begrenzt die Anzahl der Abfragen. Versuch es in etwa ${Math.max(1, Math.ceil(error.retryAfterSeconds))} Sekunden noch einmal.`
            : "Der Datenanbieter begrenzt die Anzahl der Abfragen. Versuch es in einer Minute noch einmal.",
      };
    case "offline":
      return {
        title: "Du bist offline",
        text: "Ohne Internetverbindung können keine Kurse geladen werden. Angezeigt werden die zuletzt geladenen Werte.",
      };
    case "unsupported":
      return {
        title: "Nicht unterstützt",
        text: error.message || "Dieses Wertpapier wird im Übungsdepot noch nicht unterstützt.",
      };
    case "not-found":
      return {
        title: "Nicht gefunden",
        text: "Zu diesem Wertpapier liegen beim Datenanbieter keine Daten vor.",
      };
    case "invalid-response":
      return {
        title: "Unerwartete Antwort",
        text: "Der Datenanbieter hat unvollständige Daten geliefert. Es wird kein Kurs angezeigt.",
      };
    case "aborted":
      return { title: "Abgebrochen", text: "Die Anfrage wurde abgebrochen." };
    case "provider-error":
    default:
      return {
        title: "Datenanbieter nicht erreichbar",
        text: "Die Kurse konnten gerade nicht geladen werden. Versuch es später noch einmal.",
      };
  }
}

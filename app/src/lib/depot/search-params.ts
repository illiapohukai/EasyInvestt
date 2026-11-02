export interface InstrumentSearchParams {
  id?: string;
}

/** Validates the "?id=" search parameter used by the Depot screens. */
export function validateInstrumentSearch(search: Record<string, unknown>): InstrumentSearchParams {
  const id = search["id"];
  return typeof id === "string" && id.trim() !== "" && id.length <= 80 ? { id: id.trim() } : {};
}

import { useEffect, useRef } from "react";

/**
 * Moves keyboard and screen-reader focus to an element (usually a step
 * heading) when it appears and whenever `dependency` changes.
 */
export function useFocusOnChange<T extends HTMLElement>(dependency: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [dependency]);
  return ref;
}

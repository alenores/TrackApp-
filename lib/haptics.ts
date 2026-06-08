const DEFAULT_TAP_MS = 14;

export function triggerTapHaptic(durationMs: number = DEFAULT_TAP_MS): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  try {
    navigator.vibrate(durationMs);
  } catch {
    /* best-effort */
  }
}

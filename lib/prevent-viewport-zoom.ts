/** Clase en `<html>` para CSS de bloqueo si el media query no aplica. */
export const STANDALONE_ZOOM_LOCK_CLASS = "pwa-standalone-zoom-lock";

const DOUBLE_TAP_MS = 300;

/** iPhone, iPod, iPad (incl. iPadOS con UA de escritorio). */
export function isIosTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipod|ipad/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

type GestureLikeEvent = Event & { scale?: number };

const CAPTURE_PASSIVE_FALSE = { capture: true, passive: false } as const;

/**
 * Evita zoom nativo del viewport (PWA y navegador; iOS + Android).
 */
export function mountViewportZoomPrevention(): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }

  const root = document.documentElement;
  root.classList.add(STANDALONE_ZOOM_LOCK_CLASS);

  const cleanups: Array<() => void> = [
    () => root.classList.remove(STANDALONE_ZOOM_LOCK_CLASS),
  ];

  const add = (
    target: Document,
    type: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  const blockGesture = (event: GestureLikeEvent) => {
    event.preventDefault();
  };

  if (isIosTouchDevice()) {
    for (const type of ["gesturestart", "gesturechange", "gestureend"] as const) {
      add(document, type, blockGesture as EventListener, { passive: false });
    }
  }

  const blockMultiTouch = (event: TouchEvent) => {
    if (event.touches.length >= 2) {
      event.preventDefault();
    }
  };

  add(document, "touchstart", blockMultiTouch as EventListener, CAPTURE_PASSIVE_FALSE);
  add(document, "touchmove", blockMultiTouch as EventListener, CAPTURE_PASSIVE_FALSE);

  let lastTouchEnd = 0;

  const blockDoubleTap = (event: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= DOUBLE_TAP_MS) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  };

  add(document, "touchend", blockDoubleTap as EventListener, CAPTURE_PASSIVE_FALSE);

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}

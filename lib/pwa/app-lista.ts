export const TRACKAPP_APP_READY_EVENT = "trackapp:app-ready";

export function dispatchAppReady(): void {
  window.dispatchEvent(new Event(TRACKAPP_APP_READY_EVENT));
}

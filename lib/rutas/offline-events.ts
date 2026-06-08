export const RUTA_OFFLINE_UPDATED_EVENT = "trackapp:ruta-offline-updated";

export function notifyRutaOfflineUpdated(rutaId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RUTA_OFFLINE_UPDATED_EVENT, { detail: { rutaId } }),
  );
}

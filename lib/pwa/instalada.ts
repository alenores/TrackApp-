export const LLAVE_DE_NO_INSTALAR = "pwa-install-dismissed-v2";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function estaInstalada(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function esIphone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export function esAndroid(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /android/i.test(window.navigator.userAgent);
}

export function esCelular(): boolean {
  return esIphone() || esAndroid();
}

export function yaDijoQueNoInstalar(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(LLAVE_DE_NO_INSTALAR) === "1";
  } catch {
    return false;
  }
}

export function anotarQueNoQuiereInstalar(): void {
  try {
    window.localStorage.setItem(LLAVE_DE_NO_INSTALAR, "1");
  } catch {
    /* ignore */
  }
}

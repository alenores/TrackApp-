"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type NavigationProgressContextValue = {
  startNavigation: () => void;
  isNavigating: boolean;
};

const NavigationProgressContext =
  createContext<NavigationProgressContextValue | null>(null);

const NAVIGATION_TIMEOUT_MS = 12_000;

function isInternalAppHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function isSamePathNavigation(href: string, pathname: string): boolean {
  try {
    const url = new URL(href, "http://local");
    return url.pathname === pathname && url.search === "" && url.hash === "";
  } catch {
    return false;
  }
}

function NavigationProgressBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden={!active}
      className={[
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div className="relative h-full w-full bg-emerald-950/80">
        <div className="navigation-progress-indeterminate absolute inset-y-0 left-0 w-2/5 bg-emerald-400" />
      </div>
    </div>
  );
}

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const pathnameRef = useRef(pathname);
  const timeoutRef = useRef<number | null>(null);

  const clearNavigationTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(() => {
    clearNavigationTimeout();
    setIsNavigating(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      timeoutRef.current = null;
    }, NAVIGATION_TIMEOUT_MS);
  }, [clearNavigationTimeout]);

  const completeNavigation = useCallback(() => {
    clearNavigationTimeout();
    setIsNavigating(false);
  }, [clearNavigationTimeout]);

  useEffect(() => {
    pathnameRef.current = pathname;
    completeNavigation();
  }, [pathname, completeNavigation]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || !isInternalAppHref(href)) return;
      if (isSamePathNavigation(href, pathnameRef.current)) return;

      startNavigation();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [startNavigation]);

  return (
    <NavigationProgressContext.Provider
      value={{ startNavigation, isNavigating }}
    >
      <NavigationProgressBar active={isNavigating} />
      {children}
    </NavigationProgressContext.Provider>
  );
}

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);
  if (!context) {
    throw new Error(
      "useNavigationProgress must be used within NavigationProgressProvider",
    );
  }
  return context;
}

export function useAppNavigation() {
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      startNavigation();
      startTransition(() => {
        router.push(href);
      });
    },
    [router, startNavigation, startTransition],
  );

  return { navigate, isPending };
}

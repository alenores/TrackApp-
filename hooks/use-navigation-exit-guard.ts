"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function resolvePathname(href: string): string {
  if (href.startsWith("http")) {
    return new URL(href).pathname;
  }

  return href.split("?")[0]?.split("#")[0] ?? href;
}

export function useNavigationExitGuard(defaultExitHref: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const pendingHrefRef = useRef(defaultExitHref);
  const guardUrlRef = useRef<string | null>(null);

  const requestExit = useCallback(
    (targetHref?: string) => {
      pendingHrefRef.current = targetHref ?? defaultExitHref;
      setOpen(true);
    },
    [defaultExitHref],
  );

  const cancelExit = useCallback(() => {
    pendingHrefRef.current = defaultExitHref;
    setOpen(false);
  }, [defaultExitHref]);

  const confirmExit = useCallback(() => {
    const href = pendingHrefRef.current;
    setOpen(false);
    router.push(href);
  }, [router]);

  useEffect(() => {
    pendingHrefRef.current = defaultExitHref;
  }, [defaultExitHref]);

  useEffect(() => {
    guardUrlRef.current = window.location.href;
    window.history.pushState({ navigationExitGuard: true }, "", guardUrlRef.current);

    const handlePopState = () => {
      requestExit();
      window.history.pushState(
        { navigationExitGuard: true },
        "",
        guardUrlRef.current ?? window.location.href,
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [requestExit]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (open) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      if (href.startsWith("http") && !href.startsWith(window.location.origin)) {
        return;
      }

      const nextPath = resolvePathname(href);
      if (nextPath === pathname) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      requestExit(href.startsWith("http") ? nextPath : href);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [open, pathname, requestExit]);

  return {
    open,
    requestExit,
    cancelExit,
    confirmExit,
  };
}

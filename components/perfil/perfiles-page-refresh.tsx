"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PerfilesPageRefresh() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}

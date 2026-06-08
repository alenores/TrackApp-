"use client";

import { useEffect, useState } from "react";
import { MountainBrandMark } from "@/components/brand/mountain-brand-mark";

export function PwaSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (!isStandalone) {
      return;
    }

    setVisible(true);

    const hide = () => setVisible(false);
    const timer = window.setTimeout(hide, 900);

    if (document.readyState === "complete") {
      window.setTimeout(hide, 650);
    } else {
      window.addEventListener("load", () => window.setTimeout(hide, 450), {
        once: true,
      });
    }

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a] transition-opacity duration-300"
    >
      <MountainBrandMark className="h-28 w-28 rounded-[1.75rem] shadow-lg shadow-black/40" />
      <p className="mt-4 text-sm font-semibold tracking-wide text-emerald-100/90">
        TrackApp
      </p>
    </div>
  );
}

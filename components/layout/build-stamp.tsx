"use client";

import { usePathname } from "next/navigation";
import { DEPLOY_SHA } from "@/lib/deploy-stamp";
import { isRutaDetailPath } from "@/lib/rutas/paths";

export function BuildStamp() {
  const pathname = usePathname();

  if (isRutaDetailPath(pathname)) {
    return null;
  }

  return (
    <footer className="shrink-0 border-t border-border/50 bg-background px-3 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <p
        className="text-center text-[10px] font-mono leading-none text-slate-400/70"
        aria-hidden
      >
        {DEPLOY_SHA}
      </p>
    </footer>
  );
}

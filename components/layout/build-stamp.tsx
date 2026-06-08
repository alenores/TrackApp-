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
    <p
      className="mt-8 pb-2 text-center text-[10px] font-mono leading-none text-slate-400/70"
      aria-hidden
    >
      {DEPLOY_SHA}
    </p>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { SELLO_DE_VERSION } from "@/lib/sello-de-version";
import { isRutaDetailPath } from "@/lib/rutas/direcciones";

export function SelloDeVersion() {
  const pathname = usePathname();

  if (isRutaDetailPath(pathname)) {
    return null;
  }

  return (
    <p
      className="mt-8 pb-2 text-center text-[10px] font-mono leading-none text-texto-suave"
      aria-hidden
    >
      {SELLO_DE_VERSION}
    </p>
  );
}

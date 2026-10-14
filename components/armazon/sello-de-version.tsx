"use client";

import { usePathname } from "next/navigation";
import { SELLO_DE_VERSION } from "@/lib/sello-de-version";
import { isRutaDetailPath } from "@/lib/rutas/direcciones";

/**
 * En el celular va al final de cada pantalla; en la computadora, al pie del
 * menú lateral, donde no empuja: si fuera abajo de la pantalla, la haría
 * deslizar justo en las que tienen que quedar quietas.
 */
export function SelloDeVersion({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  if (isRutaDetailPath(pathname)) {
    return null;
  }

  return (
    <p
      className={`text-center text-[10px] font-mono leading-none text-texto-suave ${className}`}
      aria-hidden
    >
      {SELLO_DE_VERSION}
    </p>
  );
}

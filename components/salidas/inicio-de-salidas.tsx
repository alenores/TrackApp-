"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEstadoDeLaSenal } from "@/hooks/use-hay-senal";

/**
 * La entrada de la app. No es una pantalla: espera a saber si hay señal y abre
 * el inicio de verdad.
 *
 * Con señal, Salidas. Sin señal, Circuitos. Mientras tanto solo se ve que está
 * pensando: no hay cartel ni accesos, porque esa pantalla inventada parecía un
 * error y un momento después desaparecía.
 */
export function InicioDeSalidas() {
  const senal = useEstadoDeLaSenal();
  const router = useRouter();

  useEffect(() => {
    if (senal === "hay") router.replace("/salidas");
    if (senal === "no_hay") router.replace("/circuitos");
  }, [senal, router]);

  return (
    <div className="flex min-h-[50dvh] items-center justify-center" role="status" aria-label="Abriendo la app">
      <span
        aria-hidden
        className="h-10 w-10 animate-spin rounded-full border-2 border-borde border-t-texto motion-reduce:animate-none"
      />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Enlace } from "@/components/ui/enlace";
import { useHaySenal } from "@/hooks/use-hay-senal";

/** El inicio se guarda en el celular; Salidas se abre solo cuando hay señal real. */
export function InicioDeSalidas() {
  const haySenal = useHaySenal();
  const router = useRouter();

  useEffect(() => {
    if (haySenal) router.replace("/salidas");
  }, [haySenal, router]);

  return <div className="space-y-4">
    <h1 className="text-2xl font-bold uppercase text-texto">Salidas</h1>
    {haySenal
      ? <Tarjeta><p role="status" className="text-base text-texto">Abriendo Salidas…</p></Tarjeta>
      : <Tarjeta franja="ambar" className="space-y-3">
          <p role="status" className="text-base text-texto">Salidas necesita conexión. Cuando haya señal, se abrirá sola.</p>
          <p className="text-base text-texto-suave">Podés consultar tus Circuitos y navegar con los mapas que bajaste.</p>
          <div className="flex flex-wrap gap-2">
            <Enlace href="/circuitos" variante="secundario">Circuitos</Enlace>
            <Enlace href="/mapa-libre" variante="secundario">Navegación libre</Enlace>
          </div>
        </Tarjeta>}
  </div>;
}

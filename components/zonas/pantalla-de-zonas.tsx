"use client";

import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { usePuedeAdministrar } from "@/hooks/use-puede-administrar";
import { ListaDeZonas } from "@/components/zonas/lista-de-zonas";
import { Tarjeta } from "@/components/ui/tarjeta";

/**
 * La lista de zonas.
 *
 * Dibuja con lo que hay guardado en el celular y se pone al día sola, igual que
 * la lista de rutas. Cada estado tiene su cartel: nunca queda una pantalla muda.
 */

type ZonasClientProps = {
  soyAdministrador: boolean;
};

export function PantallaDeZonas({ soyAdministrador }: ZonasClientProps) {
  const puedeAdministrar = usePuedeAdministrar(soyAdministrador);
  const { paquete, estado, aviso } = useDatosDeLaApp();

  const zonas = paquete?.zonas ?? [];
  const sectores = paquete?.sectores ?? [];

  const sectoresPorZona: Record<number, number> = {};
  for (const sector of sectores) {
    sectoresPorZona[sector.zonaId] = (sectoresPorZona[sector.zonaId] ?? 0) + 1;
  }

  if (estado === "abriendo") {
    return (
      <Tarjeta className="py-8 text-center text-base text-texto-suave">
        Abriendo las zonas…
      </Tarjeta>
    );
  }

  if (estado === "sin_datos") {
    return (
      <Tarjeta franja="ambar" className="space-y-2">
        <p className="text-base font-medium text-texto">
          Todavía no hay nada guardado en este celular.
        </p>
        <p className="text-sm leading-6 text-texto-suave">
          {aviso ??
            "Conectate a internet una vez y las zonas quedan guardadas para usarlas sin señal."}
        </p>
      </Tarjeta>
    );
  }

  return (
    <div className="space-y-4">
      {estado === "sin_senal" ? (
        <Tarjeta>
          <p className="text-sm font-medium text-texto-suave">
            Sin señal. Estás viendo lo último que quedó guardado en el celular.
          </p>
        </Tarjeta>
      ) : null}

      <ListaDeZonas
        zonas={zonas}
        soyAdministrador={puedeAdministrar}
        sectoresPorZona={sectoresPorZona}
        avisoDeListaIncompleta={estado === "incompleto" ? aviso : null}
      />
    </div>
  );
}

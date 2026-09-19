"use client";

import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { ZonaList } from "@/components/zonas/zona-list";
import { Card } from "@/components/ui/card";

/**
 * La lista de zonas.
 *
 * Dibuja con lo que hay guardado en el celular y se pone al día sola, igual que
 * la lista de rutas. Cada estado tiene su cartel: nunca queda una pantalla muda.
 */

type ZonasClientProps = {
  soyAdministrador: boolean;
};

export function ZonasClient({ soyAdministrador }: ZonasClientProps) {
  const { paquete, estado, aviso } = useDatosDeLaApp();

  const zonas = paquete?.zonas ?? [];
  const sectores = paquete?.sectores ?? [];

  const sectoresPorZona: Record<number, number> = {};
  for (const sector of sectores) {
    sectoresPorZona[sector.zonaId] = (sectoresPorZona[sector.zonaId] ?? 0) + 1;
  }

  if (estado === "abriendo") {
    return (
      <Card className="py-8 text-center text-base text-texto-suave">
        Abriendo las zonas…
      </Card>
    );
  }

  if (estado === "sin_datos") {
    return (
      <Card franja="ambar" className="space-y-2">
        <p className="text-base font-medium text-texto">
          Todavía no hay nada guardado en este celular.
        </p>
        <p className="text-sm leading-6 text-texto-suave">
          {aviso ??
            "Conectate a internet una vez y las zonas quedan guardadas para usarlas sin señal."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {estado === "sin_senal" ? (
        <Card>
          <p className="text-sm font-medium text-texto-suave">
            Sin señal. Estás viendo lo último que quedó guardado en el celular.
          </p>
        </Card>
      ) : null}

      <ZonaList
        zonas={zonas}
        soyAdministrador={soyAdministrador}
        sectoresPorZona={sectoresPorZona}
        avisoDeListaIncompleta={estado === "incompleto" ? aviso : null}
      />
    </div>
  );
}

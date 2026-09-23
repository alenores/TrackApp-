"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { BotonVolver } from "@/components/ui/boton-volver";
import type { Rectangulo } from "@/types/database";
import type { RectanguloEnElMapa } from "@/lib/mapas/rectangulos";

export function PantallaDeDibujarZona() {
  const router = useRouter();
  const { paquete } = useDatosDeLaApp();
  const [rectangulo, setRectangulo] = useState<Rectangulo | null>(null);

  const rectangulosExistentes = React.useMemo(() => {
    return (paquete?.zonas ?? []).map(z => ({
      rectangulo: z.rectangulo,
      clase: "zona" as const
    }));
  }, [paquete?.zonas]);

  const alContinuar = () => {
    if (!rectangulo) return;
    router.push(`/zonas/nueva?latNorte=${rectangulo.latNorte}&latSur=${rectangulo.latSur}&lonEste=${rectangulo.lonEste}&lonOeste=${rectangulo.lonOeste}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-fondo">
      <div className="relative z-10 flex items-center p-3 gap-3 bg-superficie border-b border-borde shadow-sm">
        <BotonVolver destinoSiNoHayVuelta="/zonas" etiqueta="Volver" />
        <h1 className="text-lg font-semibold text-texto">Dibujar nueva zona</h1>
      </div>

      <div className="flex-1 relative">
        <CargadorDeMapa
          recorrido={null}
          encuadre={null}
          rectangulos={rectangulosExistentes}
          anotaciones={[]}
          enVivo={true}
          dibujando={true}
          pantallaCompleta={true}
          alDibujar={setRectangulo}
          rectangulo={rectangulo}
        />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full px-4 max-w-md">
          <Boton
            anchoCompleto
            paraNavegacion
            disabled={!rectangulo}
            onClick={alContinuar}
            className="shadow-lg"
          >
            {rectangulo ? "Continuar con estas coordenadas" : "Marcá un área para continuar"}
          </Boton>
        </div>
      </div>
    </div>
  );
}

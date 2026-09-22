import { useState, useEffect } from "react";
import type { FeatureCollection } from "geojson";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { seSuperponen } from "@/lib/datos/rectangulo";
import type { Rectangulo } from "@/types/database";
import { leerRecorrido } from "@/lib/offline/recorridos";
import { hexDeLaRuta } from "@/lib/rutas/colores";

/**
 * Encuentra qué rutas cruzan un área y maneja cuáles están encendidas, 
 * devolviendo un FeatureCollection combinado listo para dibujar en el mapa.
 */
export function useRutasEnArea(rectanguloDelArea: Rectangulo) {
  const { paquete } = useDatosDeLaApp();
  
  // Las rutas de la BD que se superponen con esta área.
  const rutasCruzadas = (paquete?.rutas ?? []).filter((ruta) => 
    seSuperponen(ruta.rectangulo, rectanguloDelArea)
  );

  const [idsEncendidos, setIdsEncendidos] = useState<number[]>([]);
  const [recorridosCargados, setRecorridosCargados] = useState<Record<number, FeatureCollection>>({});

  // Cargar el recorrido cuando se enciende una ruta y no lo teníamos
  useEffect(() => {
    let montado = true;

    idsEncendidos.forEach((id) => {
      if (!recorridosCargados[id]) {
        void leerRecorrido(id).then((geo) => {
          if (!montado || !geo) return;
          setRecorridosCargados((actual) => ({ ...actual, [id]: geo }));
        });
      }
    });

    return () => {
      montado = false;
    };
  }, [idsEncendidos, recorridosCargados]);

  const toggleRuta = (rutaId: number) => {
    setIdsEncendidos((actual) =>
      actual.includes(rutaId)
        ? actual.filter((id) => id !== rutaId)
        : [...actual, rutaId]
    );
  };

  // Combinar los recorridos encendidos, inyectando el color
  const recorridoCombinado: FeatureCollection | null =
    idsEncendidos.length === 0
      ? null
      : {
          type: "FeatureCollection",
          features: idsEncendidos.flatMap((id) => {
            const geo = recorridosCargados[id];
            if (!geo) return [];
            
            const ruta = rutasCruzadas.find((r) => r.id === id);
            const colorHex = hexDeLaRuta(ruta?.color ?? "naranja");

            return geo.features.map((feature) => ({
              ...feature,
              properties: {
                ...feature.properties,
                color: colorHex,
              },
            }));
          }),
        };

  return {
    rutasCruzadas,
    idsEncendidos,
    toggleRuta,
    recorridoCombinado,
  };
}

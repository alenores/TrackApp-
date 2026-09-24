import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection } from "geojson";
import { usePaqueteGuardado } from "@/hooks/use-paquete-guardado";
import { seSuperponen } from "@/lib/datos/rectangulo";
import type { Rectangulo, RutaResumen } from "@/types/database";
import { leerRecorrido } from "@/lib/offline/recorridos";
import { hexDeLaRuta } from "@/lib/rutas/colores";

/**
 * Encuentra qué rutas cruzan un área y maneja cuáles están encendidas, 
 * devolviendo un FeatureCollection combinado listo para dibujar en el mapa.
 *
 * Lo usa la pantalla de navegación, así que **solo lee lo guardado**: nunca
 * dispara la puesta al día.
 */
export function useRutasEnArea(rectanguloDelArea: Rectangulo, excludeRutaId?: number, idsIniciales: number[] = []) {
  const paquete = usePaqueteGuardado();
  
  // Las rutas de la BD que se superponen con esta área.
  const rutasCruzadas = (paquete?.rutas ?? []).filter((ruta) => 
    ruta.id !== excludeRutaId && seSuperponen(ruta.rectangulo, rectanguloDelArea)
  );

  const [idsEncendidos, setIdsEncendidos] = useState<number[]>(idsIniciales);
  const recorridoCombinado = useRecorridosDeRutas(rutasCruzadas, idsEncendidos);

  const toggleRuta = (rutaId: number) => {
    setIdsEncendidos((actual) =>
      actual.includes(rutaId)
        ? actual.filter((id) => id !== rutaId)
        : [...actual, rutaId]
    );
  };

  return {
    rutasCruzadas,
    idsEncendidos,
    toggleRuta,
    recorridoCombinado,
  };
}

/**
 * Las líneas de varias rutas juntas, cada una con su color, listas para el mapa.
 *
 * Las lee del celular a medida que se prenden; nunca de internet. Devuelve el
 * mismo objeto mientras no cambie nada, así el mapa no se redibuja de balde.
 */
export function useRecorridosDeRutas(
  rutas: RutaResumen[],
  idsEncendidos: number[],
): FeatureCollection | null {
  const [cargados, setCargados] = useState<Record<number, FeatureCollection>>({});

  useEffect(() => {
    let montado = true;

    for (const id of idsEncendidos) {
      if (cargados[id]) continue;
      void leerRecorrido(id).then((geo) => {
        if (!montado || !geo) return;
        setCargados((actual) => (actual[id] ? actual : { ...actual, [id]: geo }));
      });
    }

    return () => {
      montado = false;
    };
  }, [idsEncendidos, cargados]);

  return useMemo(() => {
    if (idsEncendidos.length === 0) return null;

    return {
      type: "FeatureCollection",
      features: idsEncendidos.flatMap((id) => {
        const geo = cargados[id];
        if (!geo) return [];

        const ruta = rutas.find((cada) => cada.id === id);
        const color = hexDeLaRuta(ruta?.color ?? "naranja");

        return geo.features.map((feature) => ({
          ...feature,
          properties: { ...feature.properties, color },
        }));
      }),
    };
  }, [idsEncendidos, cargados, rutas]);
}

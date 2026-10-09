import { describe, expect, it } from "vitest";
import type { Position } from "geojson";
import { crearCamino } from "@/lib/caminos/partes";
import { revisarCoordenadas, type CaminoGuardado } from "@/lib/caminos/datos";
import { ubicarEnLinea } from "@/lib/caminos/geometria";
import { leerFilaDeCircuito, prepararCircuito } from "@/lib/circuitos/datos";

/** Así llega una línea dibujada en Google Earth: con un tercer número, la altura, siempre en cero. */
const DE_GOOGLE_EARTH: Position[] = [[-64.786, -31.417, 0], [-64.788, -31.412, 0], [-64.79, -31.406, 0]];

function caminoImportado(): CaminoGuardado {
  const linea = revisarCoordenadas(DE_GOOGLE_EARTH);
  if (!linea.ok) throw new Error(linea.error);
  const creado = crearCamino(linea.datos, ["mountain_bike"]);
  if (!creado.ok) throw new Error(creado.error);
  return {
    ...creado.datos, id: 1, perfilId: "autor", nombre: "Subida", descripcion: null, alturas: null,
    versionForma: 1, creadoEn: "2026-10-08", actualizadoEn: "2026-10-08", eliminadoEn: null,
  };
}

describe("un Circuito sobre un Camino importado de Google Earth", () => {
  it("el Camino guarda solo longitud y latitud: la altura va aparte", () => {
    expect(caminoImportado().coordenadas.every((punto) => punto.length === 2)).toBe(true);
  });

  it("se guarda y se vuelve a leer sin que la base lo dé por roto", () => {
    const camino = caminoImportado();
    const toque = (lon: number, lat: number) => {
      const lugar = ubicarEnLinea(camino.coordenadas, lon, lat)!;
      return { coordenada: lugar.coordenada, enCamino: { caminoId: 1, distanciaM: lugar.distanciaM, versionForma: 1, actividadDelCamino: "mountain_bike" } };
    };
    const preparado = prepararCircuito({
      nombre: "Vuelta",
      actividad: "mountain_bike",
      puntos: [toque(-64.786, -31.417), toque(-64.79, -31.406), { coordenada: [-64.795, -31.4], enCamino: null }],
    }, [camino]);
    if (!preparado.ok) throw new Error(preparado.error);

    const leido = leerFilaDeCircuito({
      id: 7, perfil_id: "autor", nombre: preparado.datos.nombre, actividad: preparado.datos.actividad,
      puntos: preparado.datos.puntos, partes: preparado.datos.partes, caminos_base: preparado.datos.caminosBase,
      creado_en: "2026-10-08", actualizado_en: "2026-10-08", eliminado_en: null,
    });
    expect(leido.ok).toBe(true);
  });
});

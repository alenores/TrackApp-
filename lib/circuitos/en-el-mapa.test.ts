import { describe, expect, it } from "vitest";
import { crearCamino, type Camino } from "@/lib/caminos/partes";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { dibujarCircuito, toqueLibre, toqueSobreCamino } from "@/lib/circuitos/dibujo";
import { caminosParaArmarCircuito, partesDelCircuitoEnElMapa } from "@/lib/circuitos/en-el-mapa";

function camino(id: number, actividades: Array<"mountain_bike" | "trekking">): CaminoGuardado {
  const creado = crearCamino([[0, 0], [0.001, 0], [0.001, 0.001]], actividades);
  if (!creado.ok) throw new Error(creado.error);
  return {
    ...(creado.datos as Camino), id, perfilId: "autor", nombre: `Camino ${id}`,
    descripcion: null, alturas: null, versionForma: 1, creadoEn: "2026-10-07", actualizadoEn: "2026-10-07", eliminadoEn: null,
  };
}

describe("Circuitos conservan visualmente de dónde sale cada parte", () => {
  it("muestra un Camino de trekking si se lo eligió junto con mountain bike, y declara sus actividades", () => {
    const soloTrekking = camino(3, ["trekking"]);
    const dibujo = caminosParaArmarCircuito([soloTrekking], "mountain_bike", ["mountain_bike", "trekking"]);
    expect(dibujo.features).toHaveLength(1);
    expect(dibujo.features[0].properties).toMatchObject({
      actividad_mostrada: "trekking", otra_actividad: true, actividades_texto: "Trekking",
    });
    expect(caminosParaArmarCircuito([soloTrekking], "mountain_bike", ["mountain_bike"]).features).toHaveLength(0);
  });

  it("una parte propia no recibe color ni marca de dificultad de un Camino", () => {
    const a = toqueLibre([0.002, 0]);
    const b = toqueLibre([0.003, 0]);
    if (!a.ok || !b.ok) throw new Error("Los puntos libres deben ser válidos.");
    const partes = dibujarCircuito([a.datos, b.datos], []);
    if (!partes.ok) throw new Error(partes.error);
    const dibujo = partesDelCircuitoEnElMapa(partes.datos, [], "mountain_bike");
    if (!dibujo.ok) throw new Error(dibujo.error);
    expect(dibujo.datos.features[0].properties).toMatchObject({
      clase: "propia", paso: null, complejidad: null, camino_id: null,
    });
  });

  it("divide lo tomado de un Camino donde cambia la forma de pasar, sin teñir la parte propia", () => {
    const datos = camino(7, ["mountain_bike"]);
    const mitad = datos.largoM / 2;
    datos.partes = [
      { desdeM: 0, hastaM: mitad, porActividad: { mountain_bike: { paso: "transitable", complejidad: "facil" } }, observacion: null, comprobadoEl: null },
      { desdeM: mitad, hastaM: datos.largoM, porActividad: { mountain_bike: { paso: "a_pie", complejidad: "dificil" } }, observacion: null, comprobadoEl: null },
    ];
    const primero = toqueSobreCamino([0, 0], datos, "mountain_bike");
    const segundo = toqueSobreCamino([0.001, 0.001], datos, "mountain_bike");
    if (!primero.ok || !segundo.ok) throw new Error("Los extremos deben caer en el Camino.");
    const partes = dibujarCircuito([primero.datos, segundo.datos], [datos]);
    if (!partes.ok) throw new Error(partes.error);
    const dibujo = partesDelCircuitoEnElMapa(partes.datos, [datos], "mountain_bike");
    if (!dibujo.ok) throw new Error(dibujo.error);
    expect(dibujo.datos.features.map((cada) => cada.properties)).toMatchObject([
      { clase: "camino", paso: "transitable", complejidad: "facil" },
      { clase: "camino", paso: "a_pie", complejidad: "dificil" },
    ]);
  });

  it("mantiene visible un tramo tomado de un Camino retirado y rechaza si falta su línea", () => {
    const datos = camino(8, ["trekking"]);
    const primero = toqueSobreCamino([0, 0], datos, "trekking");
    const segundo = toqueSobreCamino([0.001, 0.001], datos, "trekking");
    if (!primero.ok || !segundo.ok) throw new Error("Los extremos deben caer en el Camino.");
    const partes = dibujarCircuito([primero.datos, segundo.datos], [datos]);
    if (!partes.ok) throw new Error(partes.error);
    datos.eliminadoEn = "2026-10-07";
    const dibujo = partesDelCircuitoEnElMapa(partes.datos, [datos], "mountain_bike");
    if (!dibujo.ok) throw new Error(dibujo.error);
    expect(dibujo.datos.features[0].properties).toMatchObject({ clase: "camino", otra_actividad: true });
    expect(partesDelCircuitoEnElMapa(partes.datos, [], "mountain_bike")).toMatchObject({ ok: false });
  });

  it("al volver por el mismo Camino conserva el sentido y la actividad elegida, aunque se oculte del filtro", () => {
    const datos = camino(9, ["trekking"]);
    const primero = toqueSobreCamino([0.001, 0.001], datos, "trekking");
    const segundo = toqueSobreCamino([0, 0], datos, "trekking");
    if (!primero.ok || !segundo.ok) throw new Error("Los extremos deben caer en el Camino.");
    const partes = dibujarCircuito([primero.datos, segundo.datos], [datos]);
    if (!partes.ok) throw new Error(partes.error);
    expect(partes.datos[0]).toMatchObject({ sentido: "vuelta", actividadDelCamino: "trekking" });
    const dibujo = partesDelCircuitoEnElMapa(partes.datos, [datos], "mountain_bike");
    if (!dibujo.ok) throw new Error(dibujo.error);
    expect(dibujo.datos.features[0].geometry.coordinates).toEqual([[0.001, 0.001], [0.001, 0], [0, 0]]);
    expect(dibujo.datos.features[0].properties).toMatchObject({ paso: "por_explorar", otra_actividad: true });
  });
});

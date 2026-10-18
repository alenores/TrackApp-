import { describe, expect, it } from "vitest";
import { crearCamino, type Camino } from "@/lib/caminos/partes";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { dibujarCircuito, toqueLibre, toqueSobreCamino } from "@/lib/circuitos/dibujo";
import { dibujarMiniatura, segmentosParaLaMiniatura, textoDeDondeEstas } from "@/lib/circuitos/miniatura";

function camino(id: number): CaminoGuardado {
  const creado = crearCamino([[0, 0], [0.001, 0], [0.001, 0.001]], ["trekking"]);
  if (!creado.ok) throw new Error(creado.error);
  return {
    ...(creado.datos as Camino), id, perfilId: "autor", nombre: `Camino ${id}`,
    descripcion: null, alturas: null, versionForma: 1, creadoEn: "2026-10-07", actualizadoEn: "2026-10-07", eliminadoEn: null,
  };
}

const CAJA = { x: 10, y: 10, ancho: 100, alto: 80 };

describe("Miniatura del Circuito vista desde arriba", () => {
  it("deja el norte arriba y no estira una línea vertical", () => {
    const dibujo = dibujarMiniatura([{
      coordenadas: [[-64, -31], [-64, -30.9]],
      estilo: "facil",
      paso: "transitable",
    }], CAJA, null);
    expect(dibujo).not.toBeNull();
    const [sur, norte] = dibujo!.trazos[0].puntos;
    expect(norte[1]).toBeLessThan(sur[1]);
    expect(Math.abs(norte[0] - sur[0])).toBeLessThan(1);
  });

  it("conserva el color y la marca de cada pedazo, y pone la cruz en sin paso", () => {
    const dibujo = dibujarMiniatura([
      { coordenadas: [[-64, -31], [-64, -30.95]], estilo: "facil", paso: "transitable" },
      { coordenadas: [[-64, -30.95], [-63.95, -30.95]], estilo: "dificil", paso: "sin_paso" },
    ], CAJA, [-64, -30.95]);
    expect(dibujo!.trazos.map((trazo) => trazo.estilo)).toEqual(["facil", "dificil"]);
    expect(dibujo!.trazos[0].cruz).toBeNull();
    expect(dibujo!.trazos[1].cruz).not.toBeNull();
    expect(dibujo!.aqui).not.toBeNull();
  });

  it("una parte propia no hereda color de Camino y un Camino se parte donde cambia", () => {
    const propiaA = toqueLibre([0.002, 0]);
    const propiaB = toqueLibre([0.003, 0]);
    if (!propiaA.ok || !propiaB.ok) throw new Error("Los puntos libres deben ser válidos.");
    const propias = dibujarCircuito([propiaA.datos, propiaB.datos], []);
    if (!propias.ok) throw new Error(propias.error);
    const miniPropia = segmentosParaLaMiniatura(propias.datos, [], "trekking");
    if (!miniPropia.ok) throw new Error(miniPropia.error);
    expect(miniPropia.datos[0]).toMatchObject({ estilo: "propio", paso: null });

    const datos = camino(7);
    const mitad = datos.largoM / 2;
    datos.partes = [
      { desdeM: 0, hastaM: mitad, porActividad: { trekking: { paso: "transitable", complejidad: "facil" } }, observacion: null, comprobadoEl: null },
      { desdeM: mitad, hastaM: datos.largoM, porActividad: { trekking: { paso: "sin_paso", complejidad: "dificil" } }, observacion: null, comprobadoEl: null },
    ];
    const primero = toqueSobreCamino([0, 0], datos, "trekking");
    const segundo = toqueSobreCamino([0.001, 0.001], datos, "trekking");
    if (!primero.ok || !segundo.ok) throw new Error("Los extremos deben caer en el Camino.");
    const partes = dibujarCircuito([primero.datos, segundo.datos], [datos]);
    if (!partes.ok) throw new Error(partes.error);
    const mini = segmentosParaLaMiniatura(partes.datos, [datos], "trekking");
    if (!mini.ok) throw new Error(mini.error);
    expect(mini.datos.map((cada) => ({ estilo: cada.estilo, paso: cada.paso }))).toEqual([
      { estilo: "facil", paso: "transitable" },
      { estilo: "dificil", paso: "sin_paso" },
    ]);
  });

  it("dice el largo y lo que llevás, o por qué no marca dónde estás", () => {
    expect(textoDeDondeEstas({ largoM: 12400, llevasM: 3800, alejamientoM: null, hayPosicion: true }))
      .toBe("Largo 12,4 km · llevás 3,8 km");
    expect(textoDeDondeEstas({ largoM: 12400, llevasM: null, alejamientoM: null, hayPosicion: false }))
      .toBe("Largo 12,4 km. Todavía no hay posición del GPS: no se marca dónde estás.");
    expect(textoDeDondeEstas({ largoM: 12400, llevasM: null, alejamientoM: 250, hayPosicion: true }))
      .toBe("Largo 12,4 km. Estás a 250 m del Circuito: no se marca dónde estás.");
  });
});

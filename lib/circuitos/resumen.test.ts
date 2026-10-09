import { describe, expect, it } from "vitest";
import { crearCamino } from "@/lib/caminos/partes";
import { largoDeLinea } from "@/lib/caminos/geometria";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { dibujarCircuito, toqueLibre, toqueSobreCamino } from "@/lib/circuitos/dibujo";
import { resumirCircuito } from "@/lib/circuitos/resumen";

function camino(): CaminoGuardado {
  const creado = crearCamino([[0, 0], [0.001, 0], [0.002, 0]], ["trekking"]);
  if (!creado.ok) throw new Error(creado.error);
  return {
    ...creado.datos, id: 1, perfilId: "autor", nombre: "Sendero", descripcion: null,
    alturas: null, versionForma: 1, creadoEn: "2026-10-07", actualizadoEn: "2026-10-07", eliminadoEn: null,
  };
}

function partes(datos: CaminoGuardado) {
  const puntos = [
    toqueLibre([-0.001, 0]),
    toqueSobreCamino([0, 0], datos, "trekking"),
    toqueSobreCamino([0.002, 0], datos, "trekking"),
  ];
  for (const punto of puntos) if (!punto.ok) throw new Error(punto.error);
  const dibujo = dibujarCircuito(puntos.map((punto) => {
    if (!punto.ok) throw new Error(punto.error);
    return punto.datos;
  }), [datos]);
  if (!dibujo.ok) throw new Error(dibujo.error);
  return dibujo.datos;
}

describe("Resumen permanente del Circuito", () => {
  it("se recalcula con las clasificaciones actuales y mantiene separadas dificultad y posibilidad de paso", () => {
    const datos = camino();
    const dibujo = partes(datos);
    const inicial = resumirCircuito(dibujo, [datos], "mountain_bike");
    if (!inicial.ok) throw new Error(inicial.error);
    expect(inicial.datos.propia.porcentaje).toBeCloseTo(33.3, 1);
    expect(inicial.datos.sobreCaminos.porcentaje).toBeCloseTo(66.7, 1);
    expect(inicial.datos.tramosPorExplorar).toBe(1);
    expect(inicial.datos.tramosDeOtraActividad).toBe(1);
    expect(inicial.datos.partesSinUnir).toBe(0);

    const mitad = datos.largoM / 2;
    datos.partes = [
      { desdeM: 0, hastaM: mitad, porActividad: { trekking: { paso: "a_pie", complejidad: "facil" } }, observacion: null, comprobadoEl: null },
      { desdeM: mitad, hastaM: datos.largoM, porActividad: { trekking: { paso: "sin_paso", complejidad: "dificil" } }, observacion: null, comprobadoEl: null },
    ];
    const actualizado = resumirCircuito(dibujo, [datos], "mountain_bike");
    if (!actualizado.ok) throw new Error(actualizado.error);
    expect(actualizado.datos.tramosPorExplorar).toBe(0);
    expect(actualizado.datos.tramosAPie).toBe(1);
    expect(actualizado.datos.tramosSinPaso).toBe(1);
    expect(actualizado.datos.complejidades.facil.porcentaje).toBeCloseTo(33.3, 1);
    expect(actualizado.datos.complejidades.dificil.porcentaje).toBeCloseTo(33.3, 1);
    expect(actualizado.datos.tramosDeOtraActividad).toBe(1);
    expect(actualizado.datos.consideraciones.filter((cada) => cada.tipo === "otra_actividad")).toHaveLength(1);
  });

  it("conserva y describe un Camino retirado, y muestra las separaciones reales", () => {
    const datos = camino();
    const dibujo = partes(datos);
    datos.eliminadoEn = "2026-10-07";
    dibujo.push({ tipo: "libre", sentido: null, coordenadas: [[0.004, 0], [0.005, 0]],
      caminoId: null, desdeM: null, hastaM: null, versionForma: null, actividadDelCamino: null });
    const resultado = resumirCircuito(dibujo, [datos], "trekking");
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.datos.tramosDeCaminosRetirados).toBe(1);
    expect(resultado.datos.partesSinUnir).toBe(1);
    expect(resultado.datos.consideraciones).toEqual(expect.arrayContaining([
      expect.objectContaining({ tipo: "camino_retirado", caminoNombre: "Sendero" }),
    ]));
  });

  it("no informa porcentajes como actuales si falta el Camino vinculado", () => {
    const datos = camino();
    expect(resumirCircuito(partes(datos), [], "trekking")).toMatchObject({ ok: false });
  });

  it("cuenta el final conservado como parte sin unir cuando el Camino corregido ya no llega", () => {
    const datos = camino();
    const dibujo = partes(datos);
    datos.coordenadas = [[0, 0], [0.001, 0], [0.0015, 0]];
    datos.largoM = largoDeLinea(datos.coordenadas);
    const anterior = dibujo.at(-1)!;
    dibujo[dibujo.length - 1] = {
      ...anterior, coordenadas: [[0, 0], [0.001, 0], [0.0015, 0]],
      hastaM: datos.largoM,
    };
    datos.partes = [{ ...datos.partes[0], hastaM: datos.largoM }];
    const resultado = resumirCircuito(dibujo, [datos], "trekking", [0.002, 0]);
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.datos.partesSinUnir).toBe(1);
    expect(resultado.datos.separacionDelFinalM).toBeGreaterThan(50);
    expect(resultado.datos.metrosTotales).toBeLessThan(300);
  });
});

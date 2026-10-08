import { describe, expect, it } from "vitest";
import { crearCamino, corregirLinea, partirEntre } from "@/lib/caminos/partes";
import { largoDeLinea } from "@/lib/caminos/geometria";
import { dibujarCircuito, toqueSobreCamino, type CaminoParaCircuito } from "@/lib/circuitos/dibujo";
import { correspondenciaDeCorreccion, trasladarCircuitoConCaminoCorregido, trasladarFinalSobreCamino } from "@/lib/circuitos/traslado";

const VIEJO: CaminoParaCircuito = {
  id: 9, versionForma: 1, coordenadas: [[0, 0], [0.001, 0], [0.002, 0]],
};

function parteHastaLaPunta(camino: CaminoParaCircuito, desde: number, hasta: number) {
  const primero = toqueSobreCamino([desde, 0], camino, "mountain_bike");
  const segundo = toqueSobreCamino([hasta, 0], camino, "mountain_bike");
  if (!primero.ok || !segundo.ok) throw new Error("Los puntos deben caer en el Camino.");
  const resultado = dibujarCircuito([primero.datos, segundo.datos], [camino]);
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.datos[0];
}

describe("final del Circuito cuando se corrige la punta de un Camino", () => {
  it("no se alarga con una punta nueva: termina en el lugar elegido", () => {
    const actual = { ...VIEJO, versionForma: 2, coordenadas: [...VIEJO.coordenadas, [0.003, 0]] };
    const traslado = trasladarFinalSobreCamino(parteHastaLaPunta(VIEJO, 0.001, 0.002), VIEJO, actual);
    if (!traslado.ok) throw new Error(traslado.error);
    expect(traslado.datos.parte?.coordenadas).toEqual([[0.001, 0], [0.002, 0]]);
    expect(traslado.datos.lugarConservado).toEqual([0.002, 0]);
    expect(traslado.datos.separacionM).toBe(0);
    expect(traslado.datos.parte?.versionForma).toBe(2);
  });

  it("si el Camino se acorta, conserva el final y no dibuja una unión inexistente", () => {
    const actual = { ...VIEJO, versionForma: 2, coordenadas: [[0, 0], [0.001, 0], [0.0015, 0]] };
    const traslado = trasladarFinalSobreCamino(parteHastaLaPunta(VIEJO, 0.001, 0.002), VIEJO, actual);
    if (!traslado.ok) throw new Error(traslado.error);
    expect(traslado.datos.parte?.coordenadas).toEqual([[0.001, 0], [0.0015, 0]]);
    expect(traslado.datos.lugarConservado).toEqual([0.002, 0]);
    expect(traslado.datos.finDeLaLinea).toEqual([0.0015, 0]);
    expect(traslado.datos.separacionM).toBeGreaterThan(50);
  });

  it("conserva el lugar también cuando el Circuito termina en la primera punta", () => {
    const actual = { ...VIEJO, versionForma: 2, coordenadas: [[-0.001, 0], ...VIEJO.coordenadas] };
    const traslado = trasladarFinalSobreCamino(parteHastaLaPunta(VIEJO, 0.001, 0), VIEJO, actual);
    if (!traslado.ok) throw new Error(traslado.error);
    expect(traslado.datos.parte?.sentido).toBe("vuelta");
    expect(traslado.datos.parte?.coordenadas.at(-1)).toEqual([0, 0]);
    expect(traslado.datos.separacionM).toBe(0);
  });

  it("informa cuando la parte entera desaparece y mantiene visible el final marcado", () => {
    const actual = { ...VIEJO, versionForma: 2, coordenadas: [[0, 0], [0.001, 0]] };
    const traslado = trasladarFinalSobreCamino(parteHastaLaPunta(VIEJO, 0.001, 0.002), VIEJO, actual);
    if (!traslado.ok) throw new Error(traslado.error);
    expect(traslado.datos.parte).toBeNull();
    expect(traslado.datos.lugarConservado).toEqual([0.002, 0]);
    expect(traslado.datos.separacionM).toBeGreaterThan(100);
  });

  it("traslada los puntos interiores igual que la corrección de las partes del Camino", () => {
    const creado = crearCamino(VIEJO.coordenadas, ["mountain_bike"]);
    if (!creado.ok) throw new Error(creado.error);
    const limiteViejo = largoDeLinea(VIEJO.coordenadas) * 0.7;
    const dividido = partirEntre(creado.datos, limiteViejo, creado.datos.largoM);
    if (!dividido.ok) throw new Error(dividido.error);
    const actuales = [[0, 0], [0.001, 0], [0.0014, 0.0005], [0.002, 0]];
    const corregido = corregirLinea(dividido.datos, actuales);
    const correspondencia = correspondenciaDeCorreccion(VIEJO.coordenadas, actuales);
    if (!corregido.ok || !correspondencia.ok) throw new Error("La corrección debe ser válida.");
    expect(correspondencia.datos.mover(limiteViejo)).toBeCloseTo(corregido.datos.partes[0].hastaM, 5);
  });

  it("actualiza el Circuito completo y entrega al mapa el final separado", () => {
    const actual = { ...VIEJO, versionForma: 2, coordenadas: [[0, 0], [0.001, 0], [0.0015, 0]] };
    const partes = [parteHastaLaPunta(VIEJO, 0, 0.001), parteHastaLaPunta(VIEJO, 0.001, 0.002)];
    const resultado = trasladarCircuitoConCaminoCorregido(partes, VIEJO, actual);
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.datos.partes).toHaveLength(2);
    expect(resultado.datos.partes[0].versionForma).toBe(2);
    expect(resultado.datos.partes[1].coordenadas.at(-1)).toEqual([0.0015, 0]);
    expect(resultado.datos.finalSeparado).toEqual([0.002, 0]);
    expect(resultado.datos.separacionFinalM).toBeGreaterThan(50);
    expect(resultado.datos.partes.some((cada) => cada.coordenadas.some((punto) => punto[0] === 0.002))).toBe(false);
  });

  it("mantiene unida una parte libre al punto corregido del Camino", () => {
    const viejo = { ...VIEJO, coordenadas: [[0, 0], [0.001, 0], [0.002, 0]] };
    const nuevo = { ...viejo, versionForma: 2, coordenadas: [[0, 0], [0.001, 0.0002], [0.002, 0]] };
    const partes = [
      { tipo: "libre" as const, sentido: null, coordenadas: [[-0.001, 0], [0.001, 0]],
        caminoId: null, desdeM: null, hastaM: null, versionForma: null, actividadDelCamino: null },
      parteHastaLaPunta(viejo, 0.001, 0.002),
    ];
    const cambio = trasladarCircuitoConCaminoCorregido(partes, viejo, nuevo);
    if (!cambio.ok) throw new Error(cambio.error);
    expect(cambio.datos.partes[0].coordenadas.at(-1)).toEqual(cambio.datos.partes[1].coordenadas[0]);
    expect(cambio.datos.partes[0].coordenadas.at(-1)).toEqual([0.001, 0.0002]);
  });

  it("conserva el final fijo también después de una segunda corrección", () => {
    const reducido = { ...VIEJO, versionForma: 2, coordenadas: [[0, 0], [0.001, 0], [0.0015, 0]] };
    const movido = { ...VIEJO, versionForma: 3, coordenadas: [[0, 0], [0.001, 0.0001], [0.0015, 0]] };
    const primero = trasladarCircuitoConCaminoCorregido([parteHastaLaPunta(VIEJO, 0, 0.002)], VIEJO, reducido);
    if (!primero.ok) throw new Error(primero.error);
    const segundo = trasladarCircuitoConCaminoCorregido(primero.datos.partes, reducido, movido, primero.datos.finalSeparado);
    if (!segundo.ok) throw new Error(segundo.error);
    expect(segundo.datos.finalSeparado).toEqual([0.002, 0]);
    expect(segundo.datos.partes[0].coordenadas.at(-1)).toEqual([0.0015, 0]);
  });
});

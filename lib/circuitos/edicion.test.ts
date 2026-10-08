import { describe, expect, it } from "vitest";
import { dibujarCircuito, toqueSobreCamino } from "@/lib/circuitos/dibujo";
import { puntosVigentesParaEditar } from "@/lib/circuitos/edicion";
import type { CircuitoGuardado } from "@/lib/circuitos/datos";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { trasladarCircuitoConCaminoCorregido } from "@/lib/circuitos/traslado";

describe("edición después de corregir un Camino", () => {
  it("reubica los puntos del Circuito en la línea corregida", () => {
    const viejo = { id: 7, versionForma: 1, coordenadas: [[0, 0], [0.001, 0], [0.002, 0]] };
    const nuevo = { ...viejo, versionForma: 2, coordenadas: [[0, 0], [0.001, 0.0002], [0.002, 0]] };
    const primero = toqueSobreCamino([0, 0], viejo, "mountain_bike");
    const segundo = toqueSobreCamino([0.001, 0], viejo, "mountain_bike");
    if (!primero.ok || !segundo.ok) throw new Error("Faltan los puntos.");
    const puntos = [primero.datos, segundo.datos];
    const dibujo = dibujarCircuito(puntos, [viejo]);
    if (!dibujo.ok) throw new Error(dibujo.error);
    const trasladado = trasladarCircuitoConCaminoCorregido(dibujo.datos, viejo, nuevo);
    if (!trasladado.ok) throw new Error(trasladado.error);
    const circuito = { puntos } as CircuitoGuardado;
    const camino = { ...nuevo, eliminadoEn: null } as CaminoGuardado;
    const actuales = puntosVigentesParaEditar(circuito, trasladado.datos.partes, [camino]);
    if (!actuales.ok) throw new Error(actuales.error);
    expect(actuales.datos[1].coordenada).toEqual([0.001, 0.0002]);
    expect(actuales.datos[1].enCamino?.versionForma).toBe(2);
    const redibujado = dibujarCircuito(actuales.datos, [nuevo]);
    expect(redibujado.ok).toBe(true);
  });
});

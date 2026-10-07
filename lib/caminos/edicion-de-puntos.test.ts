import { describe, expect, it } from "vitest";
import { agregarPuntoEnLinea, quitarPuntoDeLinea } from "@/lib/caminos/edicion-de-puntos";
import { clasificarTramo, corregirLinea, crearCamino } from "@/lib/caminos/partes";

describe("corrección de puntos de un Camino", () => {
  const linea = [[-64.2, -31.2], [-64.199, -31.2], [-64.198, -31.2]];

  it("agrega un punto en medio sin inventar otra línea ni perder clasificaciones", () => {
    const inicial = crearCamino(linea, ["mountain_bike"]);
    expect(inicial.ok).toBe(true);
    if (!inicial.ok) return;
    const clasificado = clasificarTramo(inicial.datos, 0, inicial.datos.largoM / 2,
      "mountain_bike", { paso: "transitable", complejidad: "media" });
    expect(clasificado.ok).toBe(true);
    if (!clasificado.ok) return;
    const nuevaLinea = agregarPuntoEnLinea(linea, -64.1985, -31.2);
    expect(nuevaLinea.ok).toBe(true);
    if (!nuevaLinea.ok) return;
    expect(nuevaLinea.datos).toHaveLength(4);
    const corregido = corregirLinea(clasificado.datos, nuevaLinea.datos);
    expect(corregido.ok).toBe(true);
    if (!corregido.ok) return;
    expect(corregido.datos.partes[0].porActividad.mountain_bike).toEqual({ paso: "transitable", complejidad: "media" });
  });

  it("no duplica un vértice ni permite quitar los dos últimos", () => {
    expect(agregarPuntoEnLinea(linea, linea[1][0], linea[1][1]).ok).toBe(false);
    expect(quitarPuntoDeLinea(linea.slice(0, 2), 0).ok).toBe(false);
    const menosUno = quitarPuntoDeLinea(linea, 1);
    expect(menosUno.ok).toBe(true);
    if (menosUno.ok) expect(menosUno.datos).toEqual([linea[0], linea[2]]);
  });
});

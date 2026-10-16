import { describe, expect, it } from "vitest";
import { actividadParaMostrar, dibujarCaminos, dibujarCaminosVisibles } from "@/lib/caminos/dibujo";
import type { CaminoGuardado } from "@/lib/caminos/datos";

describe("dibujo de Caminos por actividad", () => {
  const camino = {
    id: 8,
    nombre: "Huella del arroyo",
    actividades: ["mountain_bike", "trekking"],
    coordenadas: [[-64.2, -31.2], [-64.21, -31.21]],
    largoM: 1464.4,
    partes: [{ desdeM: 0, hastaM: 1464.4, porActividad: {
      mountain_bike: { paso: "sin_paso", complejidad: "media" },
      trekking: { paso: "transitable", complejidad: "facil" },
    }, observacion: "Puente roto", comprobadoEl: "2026-10-01" }],
  } as CaminoGuardado;

  it("muestra la clasificación de cada actividad sin cambiar la guardada", () => {
    const enBici = dibujarCaminos([camino], "mountain_bike");
    const aPie = dibujarCaminos([camino], "trekking");
    expect(enBici.features[0].properties).toMatchObject({ camino_id: 8, paso: "sin_paso", complejidad: "media" });
    expect(aPie.features[0].properties).toMatchObject({ camino_id: 8, paso: "transitable", complejidad: "facil" });
    expect(camino.partes[0].porActividad.mountain_bike?.paso).toBe("sin_paso");
  });

  it("deja visible en gris un Camino de otra actividad", () => {
    const kayak = dibujarCaminos([camino], "kayak");
    expect(kayak.features[0].properties).toMatchObject({ paso: "otra_actividad", complejidad: null });
  });

  it("en la navegación muestra el Camino si comparte alguna actividad prendida", () => {
    const todas = dibujarCaminosVisibles([camino], ["trekking", "correr", "mountain_bike", "kayak", "canyoning"]);
    expect(actividadParaMostrar(camino.actividades, ["mountain_bike", "trekking"])).toBe("trekking");
    expect(todas.features[0].properties).toMatchObject({ paso: "transitable", complejidad: "facil" });

    const soloBici = dibujarCaminosVisibles([camino], ["mountain_bike"]);
    expect(soloBici.features[0].properties).toMatchObject({ paso: "sin_paso", complejidad: "media" });

    expect(dibujarCaminosVisibles([camino], ["kayak"]).features).toEqual([]);
  });
});

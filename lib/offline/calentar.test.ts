import { describe, expect, it } from "vitest";
import { pantallasParaCalentar } from "@/lib/offline/calentar";
import type { Paquete } from "@/lib/offline/paquete";

/**
 * Las pruebas del calentado de pantallas.
 *
 * **De esto depende que una zona exista en el cerro.** El motor offline guarda
 * las pantallas a medida que se visitan, y nadie entra a las catorce zonas
 * antes de salir. Si el calentado se saltea una, esa zona no existe sin señal y
 * el usuario se entera arriba.
 */

const VACIO: Paquete = {
  caminos: [],
  circuitos: [],
  zonas: [],
  sectores: [],
  anotaciones: [],
  ultimaModificacion: null,
  guardadoEn: "",
};

function paquete(zonas: number[]): Paquete {
  return {
    ...VACIO,
    zonas: zonas.map((id) => ({ id }) as unknown as Paquete["zonas"][number]),
  };
}

function direcciones(p: Paquete): string[] {
  return pantallasParaCalentar(p).map((cada) => cada.direccion);
}

describe("qué pantallas se dejan listas", () => {
  it("las de entrada y el mapa libre van siempre, aunque no haya nada cargado", () => {
    expect(direcciones(VACIO)).toEqual(["/", "/zonas", "/circuitos", "/mapa-libre"]);
  });

  it("cada zona del paquete tiene la suya", () => {
    expect(direcciones(paquete([3, 7]))).toContain("/zonas/3");
    expect(direcciones(paquete([3, 7]))).toContain("/zonas/7");
  });

  it("ya no deja listas pantallas de Rutas, que se retiró", () => {
    expect(direcciones(paquete([3])).some((cada) => cada.startsWith("/rutas") || cada.startsWith("/navegacion/"))).toBe(false);
  });

  it("cada Circuito deja lista su navegación sin señal", () => {
    const conCircuito = { ...VACIO, circuitos: [{ id: 41, nombre: "Vuelta", actividad: "trekking" as const,
      actualizadoEn: "2026-10-08", rectangulo: null }] };
    const pantallas = pantallasParaCalentar(conCircuito);
    const navegacion = pantallas.find((cada) => cada.direccion === "/circuitos/41/navegar");
    expect(navegacion?.deposito).toBe(
      pantallas.find((cada) => cada.direccion === "/mapa-libre")?.deposito,
    );
  });

  it("el mapa libre queda listo siempre, en el depósito del cerro", () => {
    // Se abre en el cerro, sin señal: si no está guardado, no existe.
    const pantallas = pantallasParaCalentar({ ...paquete([3]), circuitos: [{ id: 12, nombre: "Vuelta", actividad: "trekking" as const, actualizadoEn: "2026-10-08", rectangulo: null }] });
    const mapaLibre = pantallas.find((cada) => cada.direccion === "/mapa-libre");
    expect(mapaLibre?.deposito).toBe(
      pantallas.find((cada) => cada.direccion === "/circuitos/12/navegar")?.deposito,
    );
  });

  it("NO se calientan las pantallas de crear ni de editar", () => {
    // Escriben en la base: sin señal no sirven, y guardarlas sería guardar un
    // formulario que al tocarlo falla.
    const cuales = direcciones({ ...paquete([3]), circuitos: [{ id: 12, nombre: "Vuelta", actividad: "trekking" as const, actualizadoEn: "2026-10-08", rectangulo: null }] });
    expect(cuales.some((cual) => /nueva|editar|perfil/.test(cual))).toBe(false);
  });

  it("la navegación del Circuito va al depósito del cerro; las zonas, al de entrada", () => {
    const pantallas = pantallasParaCalentar({ ...paquete([3]), circuitos: [{ id: 12, nombre: "Vuelta", actividad: "trekking" as const, actualizadoEn: "2026-10-08", rectangulo: null }] });
    const deposito = (direccion: string) =>
      pantallas.find((cada) => cada.direccion === direccion)?.deposito;

    expect(deposito("/circuitos/12/navegar")).toBe(deposito("/mapa-libre"));
    expect(deposito("/zonas/3")).toBe(deposito("/zonas"));
    expect(deposito("/zonas/3")).not.toBe(deposito("/circuitos/12/navegar"));
  });
});

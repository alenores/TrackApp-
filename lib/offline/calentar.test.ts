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
  rutas: [],
  zonas: [],
  sectores: [],
  anotaciones: [],
  ultimaModificacion: null,
  guardadoEn: "",
};

function paquete(zonas: number[], rutas: number[]): Paquete {
  return {
    ...VACIO,
    zonas: zonas.map((id) => ({ id }) as unknown as Paquete["zonas"][number]),
    rutas: rutas.map((id) => ({ id }) as unknown as Paquete["rutas"][number]),
  };
}

function direcciones(p: Paquete): string[] {
  return pantallasParaCalentar(p).map((cada) => cada.direccion);
}

describe("qué pantallas se dejan listas", () => {
  it("las de entrada y el mapa libre van siempre, aunque no haya nada cargado", () => {
    expect(direcciones(VACIO)).toEqual(["/", "/rutas", "/zonas", "/mapa-libre"]);
  });

  it("cada zona del paquete tiene la suya", () => {
    expect(direcciones(paquete([3, 7], []))).toContain("/zonas/3");
    expect(direcciones(paquete([3, 7], []))).toContain("/zonas/7");
  });

  it("cada ruta lleva su ficha Y su navegación", () => {
    // Sin la de navegación, salir a caminar sin señal termina en la pantalla
    // de rescate, que es justo el momento en que no se puede hacer nada.
    const cuales = direcciones(paquete([], [12]));
    expect(cuales).toContain("/rutas/12");
    expect(cuales).toContain("/navegacion/12");
  });

  it("el mapa libre queda listo siempre, en el depósito del cerro", () => {
    // Se abre en el cerro, sin señal: si no está guardado, no existe.
    const pantallas = pantallasParaCalentar(paquete([], [12]));
    const mapaLibre = pantallas.find((cada) => cada.direccion === "/mapa-libre");
    expect(mapaLibre?.deposito).toBe(
      pantallas.find((cada) => cada.direccion === "/navegacion/12")?.deposito,
    );
  });

  it("NO se calientan las pantallas de crear ni de editar", () => {
    // Escriben en la base: sin señal no sirven, y guardarlas sería guardar un
    // formulario que al tocarlo falla.
    const cuales = direcciones(paquete([3], [12]));
    expect(cuales.some((cual) => /nueva|editar|perfil/.test(cual))).toBe(false);
  });

  it("la ruta y la navegación van al depósito del cerro; las zonas, al de entrada", () => {
    const pantallas = pantallasParaCalentar(paquete([3], [12]));
    const deposito = (direccion: string) =>
      pantallas.find((cada) => cada.direccion === direccion)?.deposito;

    expect(deposito("/navegacion/12")).toBe(deposito("/rutas/12"));
    expect(deposito("/zonas/3")).toBe(deposito("/zonas"));
    expect(deposito("/zonas/3")).not.toBe(deposito("/rutas/12"));
  });
});

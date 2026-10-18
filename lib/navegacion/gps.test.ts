import { describe, expect, it } from "vitest";
import {
  alLlegarUnaFalla,
  elCartelDelGpsSaleSolo,
  etiquetaDeLaMira,
  mensajeDeErrorDelGps,
  tonoDeLaMira,
} from "@/lib/navegacion/gps";

describe("los mensajes cuando el GPS no anda", () => {
  const error = (code: number): GeolocationPositionError =>
    ({
      code,
      message: "",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    }) as GeolocationPositionError;

  it("cada mensaje dice qué hacer, no solo qué pasó", () => {
    for (const codigo of [1, 2, 3, 99]) {
      const mensaje = mensajeDeErrorDelGps(error(codigo));

      expect(mensaje.length).toBeGreaterThan(40);
      // Todos tienen que traer una instrucción en voseo.
      expect(mensaje).toMatch(
        /activá|fijate|quedate|probá|entrá|salí|volvé|revisá/i,
      );
    }
  });

  it("ninguno es un «error desconocido» a secas", () => {
    for (const codigo of [1, 2, 3, 99]) {
      const mensaje = mensajeDeErrorDelGps(error(codigo));
      expect(mensaje).not.toMatch(/^Error desconocido\.?$/i);
      expect(mensaje).not.toMatch(/algo salió mal/i);
    }
  });
});

describe("cuándo sale el cartel del GPS", () => {
  const error = (code: number): GeolocationPositionError =>
    ({
      code,
      message: "",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    }) as GeolocationPositionError;

  it("sale solo sin permiso o si el GPS no da posición", () => {
    expect(elCartelDelGpsSaleSolo(error(1))).toBe(true);
    expect(elCartelDelGpsSaleSolo(error(2))).toBe(true);
    expect(elCartelDelGpsSaleSolo(error(3))).toBe(false);
    expect(elCartelDelGpsSaleSolo(error(0))).toBe(false);
  });

  it("si tarda o deja de responder, el cartel queda cerrado hasta que lo pidan", () => {
    expect(alLlegarUnaFalla(
      { mensaje: null, abierto: false },
      { mensaje: "tardó", saleSolo: false },
    )).toEqual({ mensaje: "tardó", abierto: false });
  });

  it("sin permiso, el cartel se abre solo", () => {
    expect(alLlegarUnaFalla(
      { mensaje: null, abierto: false },
      { mensaje: "sin permiso", saleSolo: true },
    ).abierto).toBe(true);
  });

  it("la misma falla no vuelve a abrir un cartel que ya se cerró", () => {
    expect(alLlegarUnaFalla(
      { mensaje: "sin permiso", abierto: false },
      { mensaje: "sin permiso", saleSolo: true },
    ).abierto).toBe(false);
  });

  it("una falla distinta de las graves sí lo vuelve a abrir", () => {
    expect(alLlegarUnaFalla(
      { mensaje: "sin permiso", abierto: false },
      { mensaje: "no da posición", saleSolo: true },
    ).abierto).toBe(true);
  });
});

describe("el color de la mira", () => {
  it("falla en rojo, posición vieja en amarillo, y el resto en azul", () => {
    expect(tonoDeLaMira("sin_permiso", false)).toBe("fallo");
    expect(tonoDeLaMira("no_disponible", false)).toBe("fallo");
    expect(tonoDeLaMira("andando", true)).toBe("viejo");
    expect(tonoDeLaMira("andando", false)).toBe("bien");
    expect(tonoDeLaMira("pidiendo", false)).toBe("bien");
  });

  it("la etiqueta dice qué va a pasar al tocarla", () => {
    expect(etiquetaDeLaMira("fallo")).toBe("El GPS no anda");
    expect(etiquetaDeLaMira("viejo")).toBe("El GPS se perdió");
    expect(etiquetaDeLaMira("bien")).toBe("Centrar en mi ubicación");
  });
});

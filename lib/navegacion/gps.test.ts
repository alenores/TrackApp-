import { describe, expect, it } from "vitest";
import { mensajeDeErrorDelGps } from "@/lib/navegacion/gps";

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

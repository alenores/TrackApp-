import { describe, expect, it } from "vitest";
import {
  anotarLaVersionDeLasPantallas,
  lasPantallasSonDeOtraVersion,
} from "@/lib/offline/pantallas-de-otra-version";

/**
 * Que una versión nueva tire las pantallas guardadas de la anterior, y que
 * la misma versión no las tire cada vez que se abre la app.
 */

function memoria(): Map<string, string> & Pick<Storage, "getItem" | "setItem"> {
  const datos = new Map<string, string>();
  return Object.assign(datos, {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => void datos.set(clave, valor),
  });
}

describe("las pantallas guardadas de otra versión", () => {
  it("la primera vez no se sabe de qué versión son: se tratan como de otra", () => {
    expect(lasPantallasSonDeOtraVersion(memoria(), "43a9df7")).toBe(true);
  });

  it("después de anotar la versión, la misma versión no tira", () => {
    const m = memoria();
    anotarLaVersionDeLasPantallas(m, "43a9df7");
    expect(lasPantallasSonDeOtraVersion(m, "43a9df7")).toBe(false);
  });

  it("una versión nueva sí tira", () => {
    const m = memoria();
    anotarLaVersionDeLasPantallas(m, "6717995");
    expect(lasPantallasSonDeOtraVersion(m, "43a9df7")).toBe(true);
  });

  it("sin dónde anotar, no tira: mejor viejo que nada en el cerro", () => {
    expect(lasPantallasSonDeOtraVersion(null, "43a9df7")).toBe(false);
  });
});

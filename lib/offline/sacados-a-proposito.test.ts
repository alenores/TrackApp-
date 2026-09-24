// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  anotarQueLoSacasteVos,
  loSacasteVos,
  losSacadosAProposito,
  olvidarElSacado,
  olvidarTodosLosSacados,
} from "@/lib/offline/sacados-a-proposito";

/**
 * La lista que evita que la app le mienta al usuario.
 *
 * Sacar un mapa del celular funciona sin señal; avisarle a la base, no. Si ese
 * aviso se pierde, la base sigue creyendo que el mapa lo tenías y la próxima
 * apertura con señal le dice que lo perdió y le ofrece bajar de nuevo justo lo
 * que él decidió tirar. Esta lista es lo único que lo impide.
 */

beforeEach(() => {
  localStorage.clear();
});

const S7 = { sectorId: 7, tipo: "simple" } as const;
const S9 = { sectorId: 9, tipo: "simple" } as const;

describe("los mapas que sacó el usuario y la base no sabe", () => {
  it("arranca vacía", () => {
    expect(losSacadosAProposito()).toEqual([]);
  });

  it("anota el mapa que se sacó, con su tipo", () => {
    anotarQueLoSacasteVos(7, "simple");
    expect(losSacadosAProposito()).toEqual([S7]);
  });

  it("no lo anota dos veces", () => {
    anotarQueLoSacasteVos(7, "simple");
    anotarQueLoSacasteVos(7, "simple");
    expect(losSacadosAProposito()).toEqual([S7]);
  });

  it("guarda varios y los devuelve todos", () => {
    anotarQueLoSacasteVos(7, "simple");
    anotarQueLoSacasteVos(9, "simple");
    expect(losSacadosAProposito()).toEqual([S7, S9]);
  });

  it("cuando la base se entera, el pendiente se va", () => {
    anotarQueLoSacasteVos(7, "simple");
    anotarQueLoSacasteVos(9, "simple");
    olvidarElSacado(7, "simple");
    expect(losSacadosAProposito()).toEqual([S9]);
  });

  it("olvidar uno que no está no rompe nada", () => {
    anotarQueLoSacasteVos(7, "simple");
    olvidarElSacado(99, "simple");
    expect(losSacadosAProposito()).toEqual([S7]);
  });

  it("sobrevive a cerrar y volver a abrir la app", () => {
    // Vive en el celular justamente porque el aviso puede tardar días: el
    // usuario saca un mapa en el cerro y recién vuelve a tener señal al bajar.
    anotarQueLoSacasteVos(7, "simple");
    expect(JSON.parse(localStorage.getItem("trackapp-sacados-a-proposito-v1")!)).toEqual([
      "7:simple",
    ]);
  });

  it("al cerrar sesión se limpia entera", () => {
    anotarQueLoSacasteVos(7, "simple");
    olvidarTodosLosSacados();
    expect(losSacadosAProposito()).toEqual([]);
  });

  it("si lo guardado quedó ilegible, se responde que no hay nada", () => {
    // Mejor no saber de ningún pendiente que romper el inicio de la app.
    localStorage.setItem("trackapp-sacados-a-proposito-v1", "{no es json");
    expect(losSacadosAProposito()).toEqual([]);
  });

  it("descarta la basura que se haya colado", () => {
    localStorage.setItem(
      "trackapp-sacados-a-proposito-v1",
      JSON.stringify([7, "nueve", null, "11:satelital", "12:otro"]),
    );
    expect(losSacadosAProposito()).toEqual([
      { sectorId: 7, tipo: null },
      { sectorId: 11, tipo: "satelital" },
    ]);
  });
});

describe("un sector con los dos mapas", () => {
  it("sacar el simple no marca como sacado el satelital", () => {
    anotarQueLoSacasteVos(7, "simple");
    expect(loSacasteVos(7, "simple")).toBe(true);
    expect(loSacasteVos(7, "satelital")).toBe(false);
  });

  it("los anotados antes del satelital, sin tipo, valen para los dos", () => {
    localStorage.setItem("trackapp-sacados-a-proposito-v1", JSON.stringify([7]));
    expect(loSacasteVos(7, "simple")).toBe(true);
    expect(loSacasteVos(7, "satelital")).toBe(true);
  });

  it("volver a bajar uno de los dos deja pendiente el otro", () => {
    anotarQueLoSacasteVos(7, null);
    olvidarElSacado(7, "satelital");
    expect(losSacadosAProposito()).toEqual([{ sectorId: 7, tipo: "simple" }]);
  });
});

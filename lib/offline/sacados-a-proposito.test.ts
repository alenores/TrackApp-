// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  anotarQueLoSacasteVos,
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

describe("los mapas que sacó el usuario y la base no sabe", () => {
  it("arranca vacía", () => {
    expect(losSacadosAProposito()).toEqual([]);
  });

  it("anota el sector que se sacó", () => {
    anotarQueLoSacasteVos(7);
    expect(losSacadosAProposito()).toEqual([7]);
  });

  it("no lo anota dos veces", () => {
    anotarQueLoSacasteVos(7);
    anotarQueLoSacasteVos(7);
    expect(losSacadosAProposito()).toEqual([7]);
  });

  it("guarda varios y los devuelve todos", () => {
    anotarQueLoSacasteVos(7);
    anotarQueLoSacasteVos(9);
    expect(losSacadosAProposito()).toEqual([7, 9]);
  });

  it("cuando la base se entera, el pendiente se va", () => {
    anotarQueLoSacasteVos(7);
    anotarQueLoSacasteVos(9);
    olvidarElSacado(7);
    expect(losSacadosAProposito()).toEqual([9]);
  });

  it("olvidar uno que no está no rompe nada", () => {
    anotarQueLoSacasteVos(7);
    olvidarElSacado(99);
    expect(losSacadosAProposito()).toEqual([7]);
  });

  it("sobrevive a cerrar y volver a abrir la app", () => {
    // Vive en el celular justamente porque el aviso puede tardar días: el
    // usuario saca un mapa en el cerro y recién vuelve a tener señal al bajar.
    anotarQueLoSacasteVos(7);
    expect(losSacadosAProposito()).toEqual([7]);
    expect(JSON.parse(localStorage.getItem("trackapp-sacados-a-proposito-v1")!)).toEqual(
      [7],
    );
  });

  it("al cerrar sesión se limpia entera", () => {
    anotarQueLoSacasteVos(7);
    olvidarTodosLosSacados();
    expect(losSacadosAProposito()).toEqual([]);
  });

  it("si lo guardado quedó ilegible, se responde que no hay nada", () => {
    // Mejor no saber de ningún pendiente que romper el inicio de la app.
    localStorage.setItem("trackapp-sacados-a-proposito-v1", "{no es json");
    expect(losSacadosAProposito()).toEqual([]);
  });

  it("descarta la basura que se haya colado y se queda con los números", () => {
    localStorage.setItem(
      "trackapp-sacados-a-proposito-v1",
      JSON.stringify([7, "nueve", null, 11]),
    );
    expect(losSacadosAProposito()).toEqual([7, 11]);
  });
});

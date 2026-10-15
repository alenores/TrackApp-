import { describe, expect, it } from "vitest";
import { direccionDeLosLugares, leerLugaresDeInternet, sonLugaresDeInternet } from "@/lib/mapas/lugares-de-internet";

describe("lugares de internet", () => {
  it("pregunta solo por pueblos y ciudades de Argentina", () => {
    const direccion = direccionDeLosLugares("Villa Dolores");
    const parametros = new URL(direccion).searchParams;
    expect(direccion.startsWith("https://nominatim.openstreetmap.org/search")).toBe(true);
    expect(parametros.get("q")).toBe("Villa Dolores");
    expect(parametros.get("countrycodes")).toBe("ar");
    expect(parametros.get("featureType")).toBe("settlement");
  });

  it("lee el nombre, el tipo y el recuadro", () => {
    const lugares = leerLugaresDeInternet([{
      name: "Villa Dolores",
      type: "town",
      lat: "-31.945",
      lon: "-65.19",
      boundingbox: ["-31.96", "-31.93", "-65.21", "-65.17"],
      address: { state: "Córdoba" },
    }]);
    expect(lugares).toEqual([{
      nombre: "Villa Dolores",
      aclaracion: "Pueblo · Córdoba",
      encuadre: { latNorte: -31.93, latSur: -31.96, lonOeste: -65.21, lonEste: -65.17 },
    }]);
  });

  it("si no hay recuadro, deja un poco de terreno alrededor del punto", () => {
    const lugares = leerLugaresDeInternet([{ name: "Merlo", type: "city", lat: "-32.34", lon: "-65.01" }]);
    expect(lugares[0]?.nombre).toBe("Merlo");
    expect(lugares[0]?.aclaracion).toBe("Ciudad");
    expect(lugares[0]?.encuadre.latNorte).toBeGreaterThan(-32.34);
  });

  it("acepta la lista ya traducida y descarta lo raro", () => {
    const lugar = {
      nombre: "Merlo",
      aclaracion: "Ciudad · San Luis",
      encuadre: { latNorte: -32.3, latSur: -32.4, lonOeste: -65.1, lonEste: -65 },
    };
    expect(sonLugaresDeInternet([lugar, { nombre: "Nada" }])).toEqual([lugar]);
  });

  it("saltea lo que no se puede ubicar", () => {
    expect(leerLugaresDeInternet([{ name: "Nada" }, "basura", null])).toEqual([]);
    expect(leerLugaresDeInternet({ lugares: [] })).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { colorDelCirculoDelPunto, colorDelIcono } from "@/lib/anotaciones/colores-de-icono";

describe("colores de ícono de punto", () => {
  it("agua, edificio, montaña, estacionamiento y escalada tienen familias distintas", () => {
    expect(colorDelIcono("arroyo").familia).toBe("agua");
    expect(colorDelIcono("fuente").familia).toBe("agua");
    expect(colorDelIcono("cascada").familia).toBe("agua");
    expect(colorDelIcono("puente").familia).toBe("agua");
    expect(colorDelIcono("laguna").familia).toBe("agua");
    expect(colorDelIcono("lago").familia).toBe("agua");
    expect(colorDelIcono("juntura").familia).toBe("agua");
    expect(colorDelIcono("iglesia").familia).toBe("edificio");
    expect(colorDelIcono("casa").familia).toBe("edificio");
    expect(colorDelIcono("campamento").familia).toBe("edificio");
    expect(colorDelIcono("refugio").familia).toBe("edificio");
    expect(colorDelIcono("posible_escalada").familia).toBe("edificio");
    expect(colorDelIcono("objeto").familia).toBe("edificio");
    expect(colorDelIcono("cumbre").familia).toBe("montana");
    expect(colorDelIcono("tranquera").familia).toBe("montana");
    expect(colorDelIcono("quebrada").familia).toBe("montana");
    expect(colorDelIcono("estacionamiento").familia).toBe("estacionamiento");
    expect(colorDelIcono("escalada").familia).toBe("escalada");
  });

  it("el círculo del mapa usa el trazo, que se distingue de lejos", () => {
    expect(colorDelCirculoDelPunto("arroyo")).toBe(colorDelIcono("arroyo").trazo);
    expect(colorDelCirculoDelPunto("estacionamiento")).toBe(colorDelIcono("estacionamiento").trazo);
    expect(colorDelCirculoDelPunto(null)).toBe(colorDelIcono(null).trazo);
  });
});

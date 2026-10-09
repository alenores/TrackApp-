import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Registro } from "@/lib/salidas/registro";
import { subirUnRegistro, type ParaSubirRegistros } from "@/lib/salidas/subir-registros";

/**
 * Lo crítico de subir una salida registrada: que una subida cortada y
 * reintentada no cree dos borradores, y que lo registrado llegue entero.
 */

type Pedido = { tabla: string; accion: string; datos?: unknown };

/** Una base de mentira que anota lo que se le pide. */
function baseDePrueba({ yaExiste = false, insertarFalla = false } = {}) {
  const pedidos: Pedido[] = [];
  const subidas: { donde: string; clase: string | undefined }[] = [];
  let existe = yaExiste;

  const consulta = (tabla: string) => {
    let accion = "select";
    let datos: unknown;
    const cadena: Record<string, unknown> = {};
    const devolver = () => cadena;
    const respuesta = () => {
      pedidos.push({ tabla, accion, datos });
      if (accion === "insert") {
        if (insertarFalla) {
          existe = true; // Otra subida lo creó justo antes.
          return { data: null, error: { message: "duplicate key value" } };
        }
        existe = true;
        return { data: { id: 55 }, error: null };
      }
      if (accion === "select") return { data: existe ? { id: 55 } : null, error: null };
      return { data: null, error: null };
    };
    Object.assign(cadena, {
      select: devolver,
      eq: devolver,
      insert: (fila: unknown) => {
        accion = "insert";
        datos = fila;
        return cadena;
      },
      update: (fila: unknown) => {
        accion = "update";
        datos = fila;
        return cadena;
      },
      maybeSingle: async () => respuesta(),
      single: async () => respuesta(),
      then: (resolver: (valor: unknown) => void) => resolver(respuesta()),
    });
    return cadena;
  };

  const supabase = {
    from: (tabla: string) => consulta(tabla),
    storage: {
      from: () => ({
        upload: async (donde: string, _contenido: unknown, opciones?: { contentType?: string }) => {
          subidas.push({ donde, clase: opciones?.contentType });
          return { error: null };
        },
        getPublicUrl: (donde: string) => ({ data: { publicUrl: `https://base.test/${donde}` } }),
      }),
    },
  } as unknown as SupabaseClient;

  return { supabase, pedidos, subidas };
}

const REGISTRO: Registro = {
  codigo: "11111111-2222-3333-4444-555555555555",
  circuitoId: 7,
  nombreDelCircuito: "Champaquí",
  empezadoEn: Date.UTC(2026, 9, 4, 13),
  terminadoEn: Date.UTC(2026, 9, 4, 18),
  puntos: [
    { lon: -64.5, lat: -31.5, altura: null, momento: 1, precision: 8, aMano: false },
    { lon: -64.5, lat: -31.51, altura: null, momento: 2, precision: 8, aMano: false },
  ],
  salidaId: null,
  ultimoError: null,
};

function para(supabase: SupabaseClient): ParaSubirRegistros & { anotarElBorrador: ReturnType<typeof vi.fn> } {
  return {
    supabase,
    perfilId: "ale",
    actividadesDelCircuito: () => ["trekking"],
    anotarElBorrador: vi.fn(async () => {}),
  };
}

describe("subir una salida registrada", () => {
  it("crea el borrador con el código del celular, sube el GPX y anota los números", async () => {
    const { supabase, pedidos, subidas } = baseDePrueba();
    const opciones = para(supabase);

    expect(await subirUnRegistro(opciones, REGISTRO)).toBeNull();

    const creado = pedidos.find((cada) => cada.accion === "insert");
    expect(creado?.datos).toMatchObject({
      estado: "borrador",
      codigo_local: REGISTRO.codigo,
      circuito_id: 7,
      ruta_id: null,
      fecha: "2026-10-04",
      titulo: "Champaquí · 4 de octubre de 2026",
      actividades: ["trekking"],
    });
    expect(opciones.anotarElBorrador).toHaveBeenCalledWith(REGISTRO.codigo, 55);
    expect(subidas[0]).toMatchObject({ donde: "ale/salida-55.gpx", clase: "application/gpx+xml" });

    const numeros = pedidos.filter((cada) => cada.accion === "update").at(-1)?.datos as Record<string, unknown>;
    expect(numeros.largo_km).toBeCloseTo(1.11, 1);
    // Sin alturas no hay desnivel: queda vacío, no en cero.
    expect(numeros.desnivel_positivo_m).toBeNull();
  });

  it("un registro empezado antes de retirar Rutas sube con su ruta y su nombre", async () => {
    const { supabase, pedidos } = baseDePrueba();
    const viejo: Registro = { ...REGISTRO, circuitoId: null, nombreDelCircuito: null, rutaId: 3, nombreDeLaRuta: "La Banderita" };
    expect(await subirUnRegistro(para(supabase), viejo)).toBeNull();
    expect(pedidos.find((cada) => cada.accion === "insert")?.datos).toMatchObject({
      circuito_id: null,
      ruta_id: 3,
      titulo: "La Banderita · 4 de octubre de 2026",
      actividades: [],
    });
  });

  it("si el borrador ya existía (una subida anterior se cortó), no crea otro", async () => {
    const { supabase, pedidos } = baseDePrueba({ yaExiste: true });
    expect(await subirUnRegistro(para(supabase), REGISTRO)).toBeNull();
    expect(pedidos.some((cada) => cada.accion === "insert")).toBe(false);
  });

  it("si otra subida lo creó justo antes, usa ese en vez de fallar", async () => {
    const { supabase } = baseDePrueba({ insertarFalla: true });
    const opciones = para(supabase);
    expect(await subirUnRegistro(opciones, REGISTRO)).toBeNull();
    expect(opciones.anotarElBorrador).toHaveBeenCalledWith(REGISTRO.codigo, 55);
  });

  it("con el número del borrador ya guardado, no lo vuelve a buscar ni a crear", async () => {
    const { supabase, pedidos } = baseDePrueba();
    expect(await subirUnRegistro(para(supabase), { ...REGISTRO, salidaId: 55 })).toBeNull();
    expect(pedidos.some((cada) => cada.accion === "insert")).toBe(false);
  });
});

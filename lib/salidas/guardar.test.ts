import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { editarSalida } from "@/lib/salidas/guardar";
import type { DatosDeSalida } from "@/lib/salidas/reglas";

/** Una base de mentira: anota lo que se le pide y contesta que salió bien. */
function baseDePrueba() {
  const subidas: { donde: string; contenido: unknown; clase: string | undefined }[] = [];
  const cambios: Record<string, unknown>[] = [];

  const consulta = () => {
    const encadenable: Record<string, unknown> = {};
    const devolver = () => encadenable;
    Object.assign(encadenable, {
      update: (fila: Record<string, unknown>) => {
        cambios.push(fila);
        return encadenable;
      },
      insert: devolver,
      select: devolver,
      eq: devolver,
      is: devolver,
      in: devolver,
      then: (resolver: (valor: unknown) => void) => resolver({ data: [{ id: 1 }], error: null }),
    });
    return encadenable;
  };

  const supabase = {
    auth: { getSession: async () => ({ data: { session: { user: { id: "ale" } } } }) },
    from: () => consulta(),
    storage: {
      from: () => ({
        upload: async (donde: string, contenido: unknown, opciones?: { contentType?: string }) => {
          subidas.push({ donde, contenido, clase: opciones?.contentType });
          return { error: null };
        },
        getPublicUrl: (donde: string) => ({ data: { publicUrl: `https://base.test/${donde}` } }),
      }),
    },
  } as unknown as SupabaseClient;

  return { supabase, subidas, cambios };
}

const DATOS: DatosDeSalida = {
  titulo: "San Cle con Diegote",
  fecha: "2026-05-02",
  descripcion: "",
  actividades: ["mountain_bike"],
  nivelEsfuerzo: "alto",
  largoKm: 25,
  desnivelPositivoM: null,
  desnivelNegativoM: null,
  companeros: [],
};

describe("subir el archivo GPS de una salida", () => {
  it("lo sube como GPX aunque el navegador no sepa qué es, y guarda su línea", async () => {
    const { supabase, subidas, cambios } = baseDePrueba();
    // Así lo entrega Windows: un .gpx sin clase.
    const archivo = new File(["<gpx></gpx>"], "activity_21189929666.gpx", { type: "" });
    const linea: [number, number][] = [[-64.5, -31.5], [-64.4, -31.4]];
    vi.spyOn(console, "error").mockImplementation(() => {});

    const resultado = await editarSalida(supabase, 1, DATOS, [], { tipo: "nuevo", archivo, linea });

    expect(resultado.ok && resultado.datos.avisos).toEqual([]);
    const subida = subidas.find((cada) => cada.donde.endsWith(".gpx"));
    expect(subida?.clase).toBe("application/gpx+xml");
    // Se manda el contenido, no el archivo: el archivo arrastra la clase vacía del navegador.
    expect(subida?.contenido).toBeInstanceOf(Uint8Array);
    expect(cambios).toContainEqual(expect.objectContaining({ linea_simplificada: linea }));
  });
});

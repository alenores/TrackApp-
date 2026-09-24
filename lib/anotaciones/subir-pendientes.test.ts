import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { subirLosPendientes } from "@/lib/anotaciones/subir-pendientes";
import type {
  Pendiente,
  PendienteDeBorrar,
  PendienteDeCrear,
  PendienteDeEditar,
} from "@/lib/anotaciones/pendientes";

/**
 * Las pruebas de la subida de lo marcado sin señal.
 *
 * **Es lo que decide si algo marcado en el cerro llega o se pierde.** Las que
 * mandan: que los datos suban aunque la foto falle, que la foto que falló
 * quede esperando con su motivo, y que un reintento nunca duplique una marca.
 */

type Fila = Record<string, unknown> & { id: number };

/** Una base de mentira, con lo justo para lo que usa la subida. */
function baseDeMentira(opciones: {
  fallaLaFoto?: boolean;
  fallaElInsert?: string;
  filas?: Fila[];
} = {}) {
  const filas: Fila[] = opciones.filas ?? [];
  const subidas: string[] = [];
  let siguienteId = 100;

  const tabla = () => {
    let operacion: "insert" | "update" | "select" = "select";
    let valores: Record<string, unknown> = {};
    const filtros: Array<[string, unknown]> = [];

    const coinciden = () =>
      filas.filter((fila) =>
        filtros.every(([columna, valor]) =>
          valor === null ? fila[columna] === null || fila[columna] === undefined : fila[columna] === valor,
        ),
      );

    const constructor = {
      insert(nuevos: Record<string, unknown>) {
        operacion = "insert";
        valores = nuevos;
        return constructor;
      },
      update(cambios: Record<string, unknown>) {
        operacion = "update";
        valores = cambios;
        return constructor;
      },
      select() {
        return constructor;
      },
      eq(columna: string, valor: unknown) {
        filtros.push([columna, valor]);
        return constructor;
      },
      is(columna: string, valor: unknown) {
        filtros.push([columna, valor]);
        return constructor;
      },
      async single() {
        if (opciones.fallaElInsert) {
          return { data: null, error: { message: opciones.fallaElInsert, code: "XX" } };
        }
        if (filas.some((fila) => fila.codigo_local === valores.codigo_local)) {
          return { data: null, error: { message: "duplicate key", code: "23505" } };
        }
        const fila = { ...valores, id: (siguienteId += 1), eliminado_en: null };
        filas.push(fila);
        return { data: { id: fila.id }, error: null };
      },
      async maybeSingle() {
        const [fila] = coinciden();
        return { data: fila ? { id: fila.id } : null, error: null };
      },
      then(resolver: (valor: { error: null; count: number }) => void) {
        if (operacion !== "update") return resolver({ error: null, count: 0 });
        const afectadas = coinciden();
        for (const fila of afectadas) Object.assign(fila, valores);
        return resolver({ error: null, count: afectadas.length });
      },
    };
    return constructor;
  };

  const supabase = {
    from: () => tabla(),
    storage: {
      from: () => ({
        async upload(donde: string) {
          if (opciones.fallaLaFoto) return { error: { message: "sin espacio en el depósito" } };
          subidas.push(donde);
          return { error: null };
        },
        getPublicUrl(donde: string) {
          return { data: { publicUrl: `https://fotos/${donde}` } };
        },
        async remove() {
          return { error: null };
        },
      }),
    },
  } as unknown as SupabaseClient;

  return { supabase, filas, subidas };
}

function webp(): Blob {
  return new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" });
}

function marca(codigo: string, conFoto: boolean): PendienteDeCrear {
  return {
    clase: "crear",
    codigo,
    hechoEn: "2026-09-24T12:00:00Z",
    ultimoError: null,
    idLocal: -1,
    datos: {
      tipo: "punto",
      icono: "cruce",
      color: null,
      comentario: "Por acá se cruza el arroyo",
      geometria: { type: "Point", coordinates: [-64.9, -31.9] },
      precisionGpsMetros: 8,
    },
    fotos: conFoto ? { grande: webp(), chica: webp() } : null,
    anotacionId: null,
    terminada: false,
  };
}

async function subir(
  base: ReturnType<typeof baseDeMentira>,
  pendientes: Pendiente[],
) {
  const guardados = new Map<string, Pendiente>();
  const fotosBajadas: string[] = [];

  const resultado = await subirLosPendientes({
    supabase: base.supabase,
    perfilId: "yo",
    pendientes,
    guardar: async (pendiente) => {
      guardados.set(pendiente.codigo, pendiente);
    },
    guardarFotoBajada: async (direccion) => {
      fotosBajadas.push(direccion);
    },
  });

  return { resultado, guardados, fotosBajadas };
}

describe("una marca nueva", () => {
  it("sube con el punto, el comentario, quién la hizo, cuándo y sin sector", async () => {
    const base = baseDeMentira();

    const { resultado, guardados } = await subir(base, [marca("a", false)]);

    expect(resultado).toEqual({ subidos: 1, fallidos: 0, motivo: null });
    expect(base.filas).toHaveLength(1);
    expect(base.filas[0]).toMatchObject({
      perfil_id: "yo",
      sector_id: null,
      origen: "navegacion",
      codigo_local: "a",
      marcada_en: "2026-09-24T12:00:00Z",
      precision_gps_metros: 8,
      comentario: "Por acá se cruza el arroyo",
    });
    expect(guardados.get("a")).toMatchObject({ terminada: true, anotacionId: base.filas[0].id });
  });

  it("con foto, sube la grande y la chica y deja la chica en el celular", async () => {
    const base = baseDeMentira();

    const { guardados, fotosBajadas } = await subir(base, [marca("a", true)]);

    const id = base.filas[0].id;
    expect(base.subidas).toEqual([`yo/${id}.webp`, `yo/${id}-chica.webp`]);
    expect(base.filas[0].foto_chica_url).toContain(`yo/${id}-chica.webp`);
    expect(fotosBajadas).toHaveLength(1);
    expect(guardados.get("a")?.terminada).toBe(true);
  });

  it("si la foto falla, los datos quedan subidos y la foto espera con el motivo", async () => {
    const base = baseDeMentira({ fallaLaFoto: true });

    const { resultado, guardados } = await subir(base, [marca("a", true)]);

    // El punto está en la base: lo ven todos.
    expect(base.filas).toHaveLength(1);
    expect(base.filas[0].foto_url).toBeUndefined();

    const quedo = guardados.get("a") as PendienteDeCrear;
    expect(quedo.anotacionId).toBe(base.filas[0].id);
    expect(quedo.terminada).toBe(false);
    expect(quedo.ultimoError).toContain("La foto no se subió");
    expect(quedo.ultimoError).toContain("sin espacio en el depósito");
    expect(resultado.fallidos).toBe(1);
  });

  it("el reintento de la foto no vuelve a crear la anotación", async () => {
    const base = baseDeMentira({ fallaLaFoto: true });
    const { guardados } = await subir(base, [marca("a", true)]);

    const segunda = baseDeMentira({ filas: base.filas });
    await subir(segunda, [guardados.get("a")!]);

    expect(segunda.filas).toHaveLength(1);
    expect(segunda.subidas).toHaveLength(2);
  });

  it("si ya había subido y la respuesta se perdió, no se duplica", async () => {
    const base = baseDeMentira({
      filas: [{ id: 7, codigo_local: "a", eliminado_en: null }],
    });

    const { guardados } = await subir(base, [marca("a", false)]);

    expect(base.filas).toHaveLength(1);
    expect(guardados.get("a")).toMatchObject({ anotacionId: 7, terminada: true });
  });

  it("si la base la rechaza, queda esperando con el motivo real", async () => {
    const base = baseDeMentira({ fallaElInsert: "permission denied for table anotaciones" });

    const { resultado, guardados } = await subir(base, [marca("a", false)]);

    expect(resultado.fallidos).toBe(1);
    expect(guardados.get("a")?.terminada).toBe(false);
    expect(resultado.motivo).toContain("permiso");
    // El motivo queda en la marca: es lo que el inicio le muestra al usuario.
    expect(guardados.get("a")?.ultimoError).toContain("permiso");
  });

  it("una marca que falla no frena a las demás", async () => {
    const base = baseDeMentira({ fallaLaFoto: true });

    const { resultado } = await subir(base, [marca("a", true), marca("b", false)]);

    expect(base.filas).toHaveLength(2);
    expect(resultado).toMatchObject({ subidos: 1, fallidos: 1 });
  });
});

describe("cambios y borrados hechos sin señal", () => {
  it("un cambio pisa los datos de la anotación", async () => {
    const base = baseDeMentira({ filas: [{ id: 5, comentario: "viejo", eliminado_en: null }] });
    const cambio: PendienteDeEditar = {
      clase: "editar",
      codigo: "c",
      hechoEn: "2026-09-24T12:00:00Z",
      ultimoError: null,
      anotacionId: 5,
      datos: marca("x", false).datos,
      fotos: null,
      quitarLaFoto: false,
      terminada: false,
    };

    const { guardados } = await subir(base, [cambio]);

    expect(base.filas[0].comentario).toBe("Por acá se cruza el arroyo");
    expect(guardados.get("c")?.terminada).toBe(true);
  });

  it("un cambio sobre algo que ya no está lo dice, no lo da por hecho", async () => {
    const base = baseDeMentira();
    const cambio: PendienteDeEditar = {
      clase: "editar",
      codigo: "c",
      hechoEn: "",
      ultimoError: null,
      anotacionId: 999,
      datos: marca("x", false).datos,
      fotos: null,
      quitarLaFoto: false,
      terminada: false,
    };

    const { resultado, guardados } = await subir(base, [cambio]);

    expect(resultado.fallidos).toBe(1);
    expect(guardados.get("c")?.ultimoError).toContain("ya no está");
  });

  it("un borrado marca la anotación como borrada, sin borrarla de verdad", async () => {
    const base = baseDeMentira({ filas: [{ id: 5, eliminado_en: null }] });
    const borrado: PendienteDeBorrar = {
      clase: "borrar",
      codigo: "d",
      hechoEn: "",
      ultimoError: null,
      anotacionId: 5,
      terminada: false,
    };

    await subir(base, [borrado]);

    expect(base.filas).toHaveLength(1);
    expect(base.filas[0].eliminado_en).toBeTruthy();
  });

  it("lo ya terminado no se vuelve a subir", async () => {
    const base = baseDeMentira();

    const { resultado } = await subir(base, [{ ...marca("a", false), terminada: true }]);

    expect(base.filas).toHaveLength(0);
    expect(resultado).toEqual({ subidos: 0, fallidos: 0, motivo: null });
  });
});

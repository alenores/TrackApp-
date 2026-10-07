import type { Position } from "geojson";
import { describe, expect, it } from "vitest";
import { clasificarTramo, crearCamino, actualizarDatosDeTramo, type Camino } from "@/lib/caminos/partes";
import {
  cambiosEntre,
  columnasDelCamino,
  esFechaDelCalendario,
  leerFilaDeCamino,
  mismoMomento,
  revisarDescripcion,
  revisarFechaDeComprobacion,
  revisarNombre,
  revisarObservacion,
  traducirErrorDeCaminos,
} from "@/lib/caminos/datos";

/**
 * La traducción entre la fila de la base y un Camino.
 *
 * **Una fila rota que pasa como buena dibuja en el mapa un pedazo de camino
 * sin condición de paso.** Por eso se prueba sobre todo que lo incompleto se
 * rechace con el motivo, y que lo que entra salga igual.
 */

function linea(puntos: number): Position[] {
  return Array.from({ length: puntos }, (_, i) => [-64.5 + i * 0.001, -31.4]);
}

function abrir<T>(resultado: { ok: true; datos: T } | { ok: false; error: string }): T {
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.datos;
}

/** Un Camino clasificado, con observación y fecha, como lo dejaría el editor. */
function caminoClasificado(): Camino {
  let camino = abrir(crearCamino(linea(11), ["trekking", "mountain_bike"]));
  camino = abrir(clasificarTramo(camino, 0, 300, "mountain_bike", { paso: "a_pie", complejidad: "media" }));
  camino = abrir(clasificarTramo(camino, 0, 300, "trekking", { paso: "transitable" }));
  camino = abrir(actualizarDatosDeTramo(camino, 0, 300, { observacion: "Piedra suelta", comprobadoEl: "2026-10-04" }));
  return camino;
}

/** La fila como la devolvería la base: todo pasado por JSON, como viaja de verdad. */
function filaDe(camino: Camino, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const fila = {
    id: 12,
    perfil_id: "11111111-1111-4111-8111-111111111111",
    ...columnasDelCamino({ ...camino, nombre: "Bajada al río", descripcion: null }),
    version_forma: 1,
    creado_en: "2026-10-06T12:00:00.123456+00:00",
    actualizado_en: "2026-10-06T12:00:00.123456+00:00",
    eliminado_en: null,
    ...extra,
  };
  return JSON.parse(JSON.stringify(fila));
}

describe("de la base al Camino y de vuelta", () => {
  it("lo que se guarda vuelve igual: línea, partes, clasificación por actividad, observación y fecha", () => {
    const camino = caminoClasificado();
    const leido = abrir(leerFilaDeCamino(filaDe(camino)));

    expect(leido.id).toBe(12);
    expect(leido.perfilId).toBe("11111111-1111-4111-8111-111111111111");
    expect(leido.nombre).toBe("Bajada al río");
    expect(leido.versionForma).toBe(1);
    expect(leido.eliminadoEn).toBeNull();
    expect(leido.actividades).toEqual(camino.actividades);
    expect(leido.coordenadas).toEqual(camino.coordenadas);
    expect(leido.largoM).toBe(camino.largoM);
    expect(leido.partes).toEqual(camino.partes);
    expect(leido.partes[0].porActividad.mountain_bike).toEqual({ paso: "a_pie", complejidad: "media" });
    expect(leido.partes[0].observacion).toBe("Piedra suelta");
    expect(leido.partes[0].comprobadoEl).toBe("2026-10-04");
  });

  it("guarda las partes con nombres de la base, en snake_case", () => {
    const columnas = columnasDelCamino({ ...caminoClasificado(), nombre: "X", descripcion: null });
    expect(Object.keys(columnas.partes[0]).sort()).toEqual(["comprobado_el", "desde_m", "hasta_m", "observacion", "por_actividad"]);
    expect(columnas.geometria.type).toBe("LineString");
  });

  it("las columnas que se escriben nunca llevan autor, número, fechas ni versión", () => {
    const columnas = columnasDelCamino({ ...caminoClasificado(), nombre: "X", descripcion: null });
    expect(Object.keys(columnas).sort()).toEqual(["actividades", "descripcion", "geometria", "largo_m", "nombre", "partes"]);
  });

  it("acepta el largo como texto, que es como puede llegar un número exacto de la base", () => {
    const camino = caminoClasificado();
    const leido = leerFilaDeCamino(filaDe(camino, { largo_m: String(camino.largoM) }));
    expect(leido.ok).toBe(true);
  });
});

describe("un Camino incompleto o roto no pasa", () => {
  const casos: Array<[string, (fila: Record<string, unknown>) => void, RegExp]> = [
    ["sin partes", (fila) => { fila.partes = []; }, /ninguna parte/],
    ["sin la lista de partes", (fila) => { delete fila.partes; }, /lista de sus partes/],
    ["con un hueco entre partes", (fila) => {
      const partes = fila.partes as Array<Record<string, number>>;
      partes[1].desde_m += 5;
    }, /hueco/],
    ["con una actividad sin clasificar", (fila) => {
      const partes = fila.partes as Array<{ por_actividad: Record<string, unknown> }>;
      delete partes[0].por_actividad.trekking;
    }, /falta la clasificación de Trekking/],
    ["con una condición inventada", (fila) => {
      const partes = fila.partes as Array<{ por_actividad: Record<string, { paso: string }> }>;
      partes[0].por_actividad.trekking.paso = "volando";
    }, /que no existe/],
    ["sin actividades", (fila) => { fila.actividades = []; }, /al menos una actividad/],
    ["con una línea que no es línea", (fila) => { fila.geometria = { type: "Point", coordinates: [-64.5, -31.4] }; }, /forma de una línea/],
    ["con el largo cambiado", (fila) => { fila.largo_m = 1; }, /largo guardado no coincide/],
    ["con una fecha que no existe", (fila) => {
      const partes = fila.partes as Array<Record<string, unknown>>;
      partes[0].comprobado_el = "2026-02-30";
    }, /fecha de comprobación que no existe/],
    ["sin autor", (fila) => { fila.perfil_id = null; }, /quién lo subió/],
    ["sin fecha de cambio", (fila) => { delete fila.actualizado_en; }, /fechas/],
  ];

  for (const [nombre, romper, motivo] of casos) {
    it(nombre, () => {
      const fila = filaDe(caminoClasificado());
      romper(fila);
      const leido = leerFilaDeCamino(fila);
      expect(leido.ok).toBe(false);
      if (leido.ok) return;
      expect(leido.error).toMatch(motivo);
      expect(leido.error).toMatch(/Avisale al administrador/);
    });
  }

  it("algo que ni siquiera es una fila", () => {
    const leido = leerFilaDeCamino("hola");
    expect(leido.ok).toBe(false);
  });
});

describe("solo viaja lo que cambió", () => {
  it("clasificar una parte no vuelve a mandar la línea", () => {
    const antes = { ...caminoClasificado(), nombre: "X", descripcion: null };
    const despues = abrir(clasificarTramo(antes, 300, 600, "trekking", { paso: "sin_paso" }));
    const cambios = cambiosEntre(columnasDelCamino(antes), columnasDelCamino(despues));
    expect(Object.keys(cambios)).toEqual(["partes"]);
  });

  it("si no cambió nada, no hay nada para guardar", () => {
    const camino = { ...caminoClasificado(), nombre: "X", descripcion: null };
    expect(cambiosEntre(columnasDelCamino(camino), columnasDelCamino(camino))).toEqual({});
  });
});

describe("lo que escribe la persona", () => {
  it("el nombre es obligatorio y tiene tope", () => {
    expect(abrir(revisarNombre("  Huella del filo  "))).toBe("Huella del filo");
    expect(revisarNombre("   ").ok).toBe(false);
    expect(revisarNombre("x".repeat(121)).ok).toBe(false);
  });

  it("la observación vacía se guarda como vacía y tiene tope", () => {
    expect(abrir(revisarObservacion("  "))).toBeNull();
    expect(revisarObservacion("x".repeat(1001)).ok).toBe(false);
    expect(revisarObservacion(42).ok).toBe(false);
  });

  it("cuenta los caracteres como la base, incluso los símbolos que JavaScript divide en dos", () => {
    expect(revisarNombre("🚲".repeat(120)).ok).toBe(true);
    expect(revisarNombre("🚲".repeat(121)).ok).toBe(false);
    expect(revisarDescripcion("🚲".repeat(2000)).ok).toBe(true);
    expect(revisarDescripcion("🚲".repeat(2001)).ok).toBe(false);
    expect(revisarObservacion("🚲".repeat(1000)).ok).toBe(true);
    expect(revisarObservacion("🚲".repeat(1001)).ok).toBe(false);
  });

  it("la fecha de comprobación existe y no es más adelante que hoy", () => {
    expect(abrir(revisarFechaDeComprobacion("2026-10-04", "2026-10-06"))).toBe("2026-10-04");
    expect(abrir(revisarFechaDeComprobacion("", "2026-10-06"))).toBeNull();
    expect(revisarFechaDeComprobacion("2026-10-07", "2026-10-06").ok).toBe(false);
    expect(revisarFechaDeComprobacion("2026-13-01", "2026-10-06").ok).toBe(false);
    expect(esFechaDelCalendario("2024-02-29")).toBe(true);
    expect(esFechaDelCalendario("2026-02-29")).toBe(false);
  });
});

describe("la misma versión", () => {
  it("reconoce el mismo instante escrito de dos formas", () => {
    expect(mismoMomento("2026-10-06T12:00:00.123456+00:00", "2026-10-06T09:00:00.123456-03:00")).toBe(true);
    expect(mismoMomento("2026-10-06 12:00:00.1+00", "2026-10-06T12:00:00.100000Z")).toBe(true);
  });

  it("distingue dos guardados en el mismo milisegundo", () => {
    expect(mismoMomento("2026-10-06T12:00:00.123456+00:00", "2026-10-06T12:00:00.123457+00:00")).toBe(false);
  });

  it("no da por igual algo que no es una fecha", () => {
    expect(mismoMomento("ayer", "ayer")).toBe(false);
  });
});

describe("los errores de la base, en palabras", () => {
  it("antes de aplicar el SQL dice que los Caminos no están habilitados", () => {
    expect(traducirErrorDeCaminos('relation "public.caminos" does not exist')).toMatch(/todavía no están habilitados/);
    expect(traducirErrorDeCaminos("Could not find the table 'public.caminos' in the schema cache")).toMatch(/todavía no están habilitados/);
  });

  it("traduce las reglas propias de la tabla", () => {
    expect(traducirErrorDeCaminos('new row for relation "caminos" violates check constraint "caminos_partes_validas"')).toMatch(/no cubren la línea entera/);
    expect(traducirErrorDeCaminos("No se puede cambiar quién creó un Camino.")).toMatch(/avisale al administrador/);
  });

  it("deja pasar los generales a la traducción de siempre", () => {
    expect(traducirErrorDeCaminos("new row violates row-level security policy for table \"caminos\"")).toMatch(/No tenés permiso/);
  });

  it("una espera vencida dice que la base tardó", () => {
    expect(traducirErrorDeCaminos("AbortError: This operation was aborted")).toMatch(/tardó demasiado/);
  });
});

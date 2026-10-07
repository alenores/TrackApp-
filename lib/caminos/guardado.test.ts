import type { Position } from "geojson";
import { describe, expect, it } from "vitest";
import type { ColumnasDeCamino, CambiosDeCamino, CaminoGuardado } from "@/lib/caminos/datos";
import type { QuienUsa } from "@/lib/caminos/permisos";
import { clasificacionDe, parteEn } from "@/lib/caminos/partes";
import {
  cambiarActividadesGuardadas,
  cambiarDatosDeParteGuardada,
  cambiarNombreGuardado,
  clasificarParteGuardada,
  corregirLineaGuardada,
  crearCaminoGuardado,
  leerCaminoGuardado,
  leerCaminosVivos,
  retirarCaminoGuardado,
  type BaseDeCaminos,
} from "@/lib/caminos/guardado";

/**
 * Guardar Caminos contra una base falsa, en memoria.
 *
 * La base falsa hace lo mismo que va a hacer la de verdad con el SQL propuesto:
 * pone la fecha de cambio con microsegundos, sube la versión cuando cambia la
 * línea, rechaza cambiar el autor y **solo cambia una fila si su fecha sigue
 * siendo la que se leyó**. No se toca la base real.
 *
 * Lo que estas pruebas no pueden probar —que la base de verdad exija los
 * permisos aunque alguien se saltee la app— queda para cuando se aplique el SQL.
 */

const ADMINISTRADOR: QuienUsa = { perfilId: "aaaaaaaa-0000-4000-8000-000000000001", categoria: "administrador" };
const PREMIUM: QuienUsa = { perfilId: "bbbbbbbb-0000-4000-8000-000000000002", categoria: "premium" };
const OTRO_PREMIUM: QuienUsa = { perfilId: "cccccccc-0000-4000-8000-000000000003", categoria: "premium" };
const NORMAL: QuienUsa = { perfilId: "dddddddd-0000-4000-8000-000000000004", categoria: "normal" };

function linea(puntos: number, lat = -31.4): Position[] {
  return Array.from({ length: puntos }, (_, i) => [-64.5 + i * 0.001, lat]);
}

function abrir<T>(resultado: { ok: true; datos: T } | { ok: false; error: string }): T {
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.datos;
}

function error(resultado: { ok: true } | { ok: false; error: string }): string {
  if (resultado.ok) throw new Error("Se esperaba que fallara y salió bien.");
  return resultado.error;
}

type Fila = Record<string, unknown> & { id: number; actualizado_en: string; eliminado_en: string | null };

function baseFalsa() {
  const filas = new Map<number, Fila>();
  let siguienteId = 1;
  let reloj = 0;
  const llamadas = { insertar: 0, actualizar: 0 };
  const copia = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;
  // Como la base: microsegundos, siempre distintos entre un guardado y otro.
  const ahora = () => `2026-10-06T12:00:00.${String((reloj += 1)).padStart(6, "0")}+00:00`;

  const base: BaseDeCaminos = {
    async leer(id) {
      const fila = filas.get(id);
      return { fila: fila ? copia(fila) : null, error: null };
    },
    async insertar(nueva: ColumnasDeCamino & { perfil_id: string }) {
      llamadas.insertar += 1;
      const momento = ahora();
      const fila: Fila = {
        ...copia(nueva),
        id: siguienteId++,
        version_forma: 1,
        creado_en: momento,
        actualizado_en: momento,
        eliminado_en: null,
      };
      filas.set(fila.id, fila);
      return { fila: copia(fila), error: null };
    },
    async actualizarSiNadieCambio(id, leido, cambios: CambiosDeCamino) {
      llamadas.actualizar += 1;
      if ("perfil_id" in cambios) return { fila: null, error: "No se puede cambiar quién creó un Camino." };
      const fila = filas.get(id);
      if (!fila || fila.actualizado_en !== leido) return { fila: null, error: null };
      const cambiada: Fila = { ...fila, ...copia(cambios), actualizado_en: ahora() };
      if (cambios.geometria && JSON.stringify(cambios.geometria) !== JSON.stringify(fila.geometria)) {
        cambiada.version_forma = Number(fila.version_forma) + 1;
      }
      filas.set(id, cambiada);
      return { fila: copia(cambiada), error: null };
    },
    leerPaginaDeVivos(desde, hasta) {
      const vivas = [...filas.values()].filter((fila) => fila.eliminado_en === null).sort((a, b) => a.id - b.id);
      return Promise.resolve({ data: copia(vivas.slice(desde, hasta + 1)), error: null });
    },
    async contarVivos() {
      return { cantidad: [...filas.values()].filter((fila) => fila.eliminado_en === null).length, error: null };
    },
  };

  /** Otra persona guarda algo en el medio. */
  function otraPersonaGuarda(id: number) {
    const fila = filas.get(id)!;
    filas.set(id, { ...fila, nombre: `${String(fila.nombre)} (cambiado)`, actualizado_en: ahora() });
  }

  return { base, filas, llamadas, otraPersonaGuarda };
}

async function caminoDe(quien: QuienUsa, entorno = baseFalsa()) {
  const camino = abrir(await crearCaminoGuardado(entorno.base, quien, {
    nombre: "Huella del filo",
    actividades: ["trekking", "mountain_bike"],
    coordenadas: linea(11),
  }));
  return { entorno, camino };
}

describe("crear", () => {
  it("Premium crea un Camino a su nombre, con una sola parte por explorar", async () => {
    const { camino } = await caminoDe(PREMIUM);
    expect(camino.perfilId).toBe(PREMIUM.perfilId);
    expect(camino.versionForma).toBe(1);
    expect(camino.partes).toHaveLength(1);
    expect(clasificacionDe(camino.partes[0], "mountain_bike")).toEqual({ paso: "por_explorar", complejidad: null });
  });

  it("Normal no crea, y ni siquiera se le pide nada a la base", async () => {
    const entorno = baseFalsa();
    const resultado = await crearCaminoGuardado(entorno.base, NORMAL, {
      nombre: "Atajo", actividades: ["trekking"], coordenadas: linea(3),
    });
    expect(error(resultado)).toMatch(/no sumarlos/);
    expect(entorno.llamadas.insertar).toBe(0);
  });

  it("un Camino incompleto no se guarda: sin nombre, sin actividad o sin línea", async () => {
    const entorno = baseFalsa();
    expect(error(await crearCaminoGuardado(entorno.base, PREMIUM, { nombre: " ", actividades: ["trekking"], coordenadas: linea(3) }))).toMatch(/nombre/);
    expect(error(await crearCaminoGuardado(entorno.base, PREMIUM, { nombre: "A", actividades: [], coordenadas: linea(3) }))).toMatch(/al menos una actividad/);
    expect(error(await crearCaminoGuardado(entorno.base, PREMIUM, { nombre: "A", actividades: ["trekking"], coordenadas: [[-64.5, -31.4]] }))).toMatch(/dos puntos/);
    expect(error(await crearCaminoGuardado(entorno.base, PREMIUM, { nombre: "A", actividades: ["trekking"], coordenadas: "nada" }))).toMatch(/no llegó bien/);
    expect(entorno.llamadas.insertar).toBe(0);
  });
});

describe("permisos al cambiar", () => {
  it("Premium cambia el suyo; otro Premium no; el administrador sí, y el autor sigue siendo el mismo", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);

    const ajeno = await cambiarNombreGuardado(entorno.base, OTRO_PREMIUM, camino.id, camino.actualizadoEn, { nombre: "Otro nombre" });
    expect(error(ajeno)).toMatch(/lo subió otra persona/);
    expect(entorno.llamadas.actualizar).toBe(0);

    const delAdministrador = abrir(await cambiarNombreGuardado(entorno.base, ADMINISTRADOR, camino.id, camino.actualizadoEn, { nombre: "Huella del filo norte" }));
    expect(delAdministrador.nombre).toBe("Huella del filo norte");
    expect(delAdministrador.perfilId).toBe(PREMIUM.perfilId);

    const propio = abrir(await cambiarNombreGuardado(entorno.base, PREMIUM, camino.id, delAdministrador.actualizadoEn, { nombre: "Huella del filo" }));
    expect(propio.perfilId).toBe(PREMIUM.perfilId);
  });

  it("Normal no cambia nada", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    const resultado = await clasificarParteGuardada(entorno.base, NORMAL, camino.id, camino.actualizadoEn, {
      desdeM: 0, hastaM: 300, actividad: "trekking", paso: "transitable",
    });
    expect(error(resultado)).toMatch(/no cambiarlos/);
    expect(entorno.llamadas.actualizar).toBe(0);
  });
});

describe("dos personas editando a la vez", () => {
  it("si otro guardó desde que lo abriste, no se pisa: se avisa y no se guarda nada", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    entorno.otraPersonaGuarda(camino.id);

    const resultado = await clasificarParteGuardada(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, {
      desdeM: 0, hastaM: 300, actividad: "mountain_bike", paso: "sin_paso",
    });
    expect(error(resultado)).toMatch(/cambió desde que lo abriste/);
    expect(entorno.llamadas.actualizar).toBe(0);
    expect(entorno.filas.get(camino.id)!.nombre).toBe("Huella del filo (cambiado)");
  });

  it("si otro guarda justo mientras guardás, la base no cambia nada y se avisa", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    const original = entorno.base.leer;
    // Se lee bien, y antes de escribir alguien guarda.
    entorno.base.leer = async (id) => {
      const respuesta = await original(id);
      entorno.otraPersonaGuarda(id);
      return respuesta;
    };

    const resultado = await clasificarParteGuardada(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, {
      desdeM: 0, hastaM: 300, actividad: "mountain_bike", paso: "sin_paso",
    });
    expect(error(resultado)).toMatch(/cambió mientras guardabas/);
    const guardada = entorno.filas.get(camino.id)!;
    expect(guardada.nombre).toBe("Huella del filo (cambiado)");
    expect(JSON.stringify(guardada.partes)).not.toContain("sin_paso");
  });

  it("sin saber qué versión tenías abierta, no se guarda", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    const resultado = await cambiarNombreGuardado(entorno.base, PREMIUM, camino.id, undefined, { nombre: "X" });
    expect(error(resultado)).toMatch(/qué versión/);
  });
});

describe("cambiar", () => {
  it("clasificar una actividad no toca la otra ni la línea, ni sube la versión", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    const clasificado = abrir(await clasificarParteGuardada(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, {
      desdeM: 0, hastaM: 300, actividad: "mountain_bike", paso: "a_pie", complejidad: "dificil",
    }));

    expect(clasificado.coordenadas).toEqual(camino.coordenadas);
    expect(clasificado.versionForma).toBe(1);
    const primera = clasificado.partes[parteEn(clasificado, 100)!];
    expect(clasificacionDe(primera, "mountain_bike")).toEqual({ paso: "a_pie", complejidad: "dificil" });
    expect(clasificacionDe(primera, "trekking")).toEqual({ paso: "por_explorar", complejidad: null });
  });

  it("corregir la línea es el mismo Camino: conserva clasificaciones y sube la versión de la forma", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    const clasificado = abrir(await clasificarParteGuardada(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, {
      desdeM: 0, hastaM: 300, actividad: "trekking", paso: "transitable", complejidad: "facil",
    }));
    const nuevas = clasificado.coordenadas.map((punto, i) => (i === 7 ? [punto[0], punto[1] + 0.0005] : punto));
    const corregido = abrir(await corregirLineaGuardada(entorno.base, PREMIUM, camino.id, clasificado.actualizadoEn, nuevas));

    expect(corregido.id).toBe(camino.id);
    expect(corregido.perfilId).toBe(PREMIUM.perfilId);
    expect(corregido.versionForma).toBe(2);
    expect(clasificacionDe(corregido.partes[0], "trekking")).toEqual({ paso: "transitable", complejidad: "facil" });
  });

  it("observación y fecha son de la parte, compartidas por las actividades", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    const conDatos = abrir(await cambiarDatosDeParteGuardada(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, {
      desdeM: 0, hastaM: 300, observacion: "  Tranquera con candado  ", comprobadoEl: "2026-10-05",
    }, "2026-10-06"));
    const primera = conDatos.partes[parteEn(conDatos, 100)!];
    expect(primera.observacion).toBe("Tranquera con candado");
    expect(primera.comprobadoEl).toBe("2026-10-05");
    expect(clasificacionDe(primera, "trekking")).toEqual({ paso: "por_explorar", complejidad: null });
  });

  it("una fecha más adelante que hoy o un lugar que no es número no se guardan", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    expect(error(await cambiarDatosDeParteGuardada(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, {
      desdeM: 0, hastaM: 300, comprobadoEl: "2026-10-07",
    }, "2026-10-06"))).toMatch(/más adelante que hoy/);
    expect(error(await clasificarParteGuardada(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, {
      desdeM: "0", hastaM: 300, actividad: "trekking", paso: "transitable",
    }))).toMatch(/ubicar ese lugar/);
    expect(entorno.llamadas.actualizar).toBe(0);
  });

  it("sumar una actividad la agrega por explorar; sacar la última no se puede", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    const conKayak = abrir(await cambiarActividadesGuardadas(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, ["trekking", "mountain_bike", "kayak"]));
    expect(clasificacionDe(conKayak.partes[0], "kayak")).toEqual({ paso: "por_explorar", complejidad: null });

    expect(error(await cambiarActividadesGuardadas(entorno.base, PREMIUM, camino.id, conKayak.actualizadoEn, []))).toMatch(/al menos una actividad/);
  });

  it("un cambio que no cambia nada no escribe en la base", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    const igual = abrir(await cambiarNombreGuardado(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, { nombre: "Huella del filo" }));
    expect(igual.actualizadoEn).toBe(camino.actualizadoEn);
    expect(entorno.llamadas.actualizar).toBe(0);
  });
});

describe("retirar", () => {
  it("marca la fecha de retiro, conserva la fila y su autor, y ya no se puede abrir para editar", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    const retiro = abrir(await retirarCaminoGuardado(entorno.base, PREMIUM, camino.id, camino.actualizadoEn, new Date("2026-10-06T15:00:00Z")));

    expect(retiro.eliminadoEn).toBe("2026-10-06T15:00:00.000Z");
    const fila = entorno.filas.get(camino.id)!;
    expect(fila.perfil_id).toBe(PREMIUM.perfilId);
    expect(fila.eliminado_en).toBe("2026-10-06T15:00:00.000Z");
    expect(error(await leerCaminoGuardado(entorno.base, camino.id))).toMatch(/retirado/);
  });

  it("también se puede retirar un Camino guardado con un error", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    entorno.filas.set(camino.id, { ...entorno.filas.get(camino.id)!, partes: [] });
    expect(error(await leerCaminoGuardado(entorno.base, camino.id))).toMatch(/guardado con un error/);

    const retiro = await retirarCaminoGuardado(entorno.base, ADMINISTRADOR, camino.id, camino.actualizadoEn);
    expect(retiro.ok).toBe(true);
  });

  it("otro Premium no lo retira", async () => {
    const { entorno, camino } = await caminoDe(PREMIUM);
    expect(error(await retirarCaminoGuardado(entorno.base, OTRO_PREMIUM, camino.id, camino.actualizadoEn))).toMatch(/otra persona/);
    expect(entorno.filas.get(camino.id)!.eliminado_en).toBeNull();
  });
});

describe("la lista", () => {
  async function conCaminos(cantidad: number) {
    const entorno = baseFalsa();
    const modelo = abrir(await crearCaminoGuardado(entorno.base, PREMIUM, { nombre: "Modelo", actividades: ["kayak"], coordenadas: linea(3) }));
    const fila = entorno.filas.get(modelo.id)!;
    for (let id = 2; id <= cantidad; id += 1) entorno.filas.set(id, { ...fila, id, nombre: `Camino ${id}` });
    return entorno;
  }

  it("trae más de mil Caminos por páginas, sin perder ninguno", async () => {
    const entorno = await conCaminos(1_205);
    const lista = abrir(await leerCaminosVivos(entorno.base));
    expect(lista.caminos).toHaveLength(1_205);
    expect(new Set(lista.caminos.map((camino: CaminoGuardado) => camino.id)).size).toBe(1_205);
    expect(lista.conProblemas).toEqual([]);
  });

  it("no cuenta los retirados", async () => {
    const entorno = await conCaminos(3);
    entorno.filas.set(2, { ...entorno.filas.get(2)!, eliminado_en: "2026-10-06T15:00:00Z" });
    const lista = abrir(await leerCaminosVivos(entorno.base));
    expect(lista.caminos.map((camino) => camino.id)).toEqual([1, 3]);
  });

  it("si llegan menos de los que la base dice que hay, no dice «listo»", async () => {
    const entorno = await conCaminos(3);
    entorno.base.contarVivos = async () => ({ cantidad: 4, error: null });
    expect(error(await leerCaminosVivos(entorno.base))).toMatch(/Llegaron 3 Caminos de los 4/);
  });

  it("un Camino guardado con error se dice, no se esconde", async () => {
    const entorno = await conCaminos(3);
    entorno.filas.set(2, { ...entorno.filas.get(2)!, partes: [] });
    const lista = abrir(await leerCaminosVivos(entorno.base));
    expect(lista.caminos.map((camino) => camino.id)).toEqual([1, 3]);
    expect(lista.conProblemas).toHaveLength(1);
    expect(lista.conProblemas[0].id).toBe(2);
    expect(lista.conProblemas[0].motivo).toMatch(/Camino 2/);
  });
});

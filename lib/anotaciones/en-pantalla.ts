import {
  direccionDeLaFotoPendiente,
  type DatosDeLaMarca,
  type Pendiente,
} from "@/lib/anotaciones/pendientes";
import type { Anotacion } from "@/types/database";

/**
 * Las anotaciones tal como se ven en el celular: lo bajado más lo que se marcó
 * sin señal y todavía no subió.
 *
 * **Lo que el usuario marcó en el cerro se ve al instante**, aunque falten
 * horas para que haya señal. Y **se ve cómo está**: una marca que no subió, o
 * una foto que no entró, lo dice. Nunca se muestra como subido algo que no lo
 * está.
 */

export type EstadoDeSubida =
  /** Nada de esta marca llegó a la base todavía. */
  | { clase: "sin_subir"; motivo: string | null }
  /** Los datos subieron, la foto no. */
  | { clase: "foto_sin_subir"; motivo: string | null }
  /** Un cambio o un borrado que espera. */
  | { clase: "cambio_sin_subir"; motivo: string | null };

export type AnotacionEnPantalla = Anotacion & {
  /** `null` cuando todo lo de esta anotación ya está en la base. */
  subida: EstadoDeSubida | null;
  /** El código de la marca hecha en este celular, si lo es. */
  codigoDeLaMarca: string | null;
};

function conDatos(base: Anotacion, datos: DatosDeLaMarca): Anotacion {
  return {
    ...base,
    tipo: datos.tipo,
    icono: datos.icono,
    color: datos.color,
    comentario: datos.comentario,
    geometria: datos.geometria,
    precisionGpsMetros: datos.precisionGpsMetros,
  };
}

export function aplicarPendientes(
  delPaquete: Anotacion[],
  pendientes: Pendiente[],
  miPerfilId: string | null,
): AnotacionEnPantalla[] {
  const porId = new Map<number, AnotacionEnPantalla>(
    delPaquete.map((cada) => [cada.id, { ...cada, subida: null, codigoDeLaMarca: null }]),
  );
  const nuevas: AnotacionEnPantalla[] = [];

  for (const pendiente of pendientes) {
    // Lo terminado se sigue aplicando hasta que el paquete se ponga al día:
    // si no, por un rato se vería la versión vieja de algo que ya cambió.
    if (pendiente.clase === "borrar") {
      porId.delete(pendiente.anotacionId);
      continue;
    }

    if (pendiente.clase === "editar") {
      const actual = porId.get(pendiente.anotacionId);
      if (!actual) continue;

      porId.set(pendiente.anotacionId, {
        ...conDatos(actual, pendiente.datos),
        fotoChicaUrl: pendiente.fotos
          ? direccionDeLaFotoPendiente(pendiente.codigo)
          : pendiente.quitarLaFoto
            ? null
            : actual.fotoChicaUrl,
        fotoUrl: pendiente.quitarLaFoto ? null : actual.fotoUrl,
        subida: pendiente.terminada
          ? null
          : { clase: "cambio_sin_subir", motivo: pendiente.ultimoError },
        codigoDeLaMarca: actual.codigoDeLaMarca,
      });
      continue;
    }

    // Una marca nueva. Si la base ya la tiene y está en el paquete, se usa esa
    // y solo se le suma lo que falte subir.
    const enElPaquete =
      pendiente.anotacionId !== null ? porId.get(pendiente.anotacionId) : undefined;

    if (enElPaquete) {
      if (pendiente.terminada) {
        porId.set(enElPaquete.id, { ...enElPaquete, codigoDeLaMarca: pendiente.codigo });
        continue;
      }
      porId.set(enElPaquete.id, {
        ...enElPaquete,
        fotoChicaUrl:
          enElPaquete.fotoChicaUrl ??
          (pendiente.fotos ? direccionDeLaFotoPendiente(pendiente.codigo) : null),
        subida: pendiente.fotos
          ? { clase: "foto_sin_subir", motivo: pendiente.ultimoError }
          : null,
        codigoDeLaMarca: pendiente.codigo,
      });
      continue;
    }

    const base: Anotacion = {
      id: pendiente.anotacionId ?? pendiente.idLocal,
      sectorId: null,
      perfilId: miPerfilId ?? "",
      deAdministrador: false,
      tipo: pendiente.datos.tipo,
      origen: "navegacion",
      icono: null,
      color: null,
      comentario: null,
      fotoUrl: null,
      fotoChicaUrl: pendiente.fotos ? direccionDeLaFotoPendiente(pendiente.codigo) : null,
      geometria: pendiente.datos.geometria,
      marcadaEn: pendiente.hechoEn,
      precisionGpsMetros: null,
      creadoEn: pendiente.hechoEn,
      actualizadoEn: pendiente.hechoEn,
    };

    nuevas.push({
      ...conDatos(base, pendiente.datos),
      subida:
        pendiente.anotacionId === null
          ? { clase: "sin_subir", motivo: pendiente.ultimoError }
          : pendiente.fotos && !pendiente.terminada
            ? { clase: "foto_sin_subir", motivo: pendiente.ultimoError }
            : null,
      codigoDeLaMarca: pendiente.codigo,
    });
  }

  return [...porId.values(), ...nuevas];
}

/** Cuántas cosas esperan para subirse, para decirlo en el inicio. */
export function cuantosPendientesQuedan(pendientes: Pendiente[]): number {
  return pendientes.filter((cada) => !cada.terminada).length;
}

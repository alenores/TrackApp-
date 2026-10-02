import { leerLinea } from "@/lib/salidas/linea";
import type { ActividadRuta, NivelEsfuerzo, PerfilBreve, Salida } from "@/types/database";

/**
 * La traducción entre la fila de la base y la salida que usa la app.
 *
 * Está sola, sin nada de base, para poder probarla entera.
 */

type FilaDePerfil = { id: string; nombre: string | null; avatar_url: string | null } | null;

export type FilaDeSalida = {
  id: number;
  titulo: string;
  fecha: string;
  descripcion: string | null;
  actividades: ActividadRuta[] | null;
  nivel_esfuerzo: NivelEsfuerzo | null;
  largo_km: number | string | null;
  desnivel_positivo_m: number | null;
  desnivel_negativo_m: number | null;
  archivo_url: string | null;
  linea_simplificada?: unknown;
  creado_en: string;
  perfil: FilaDePerfil;
  fotos: { orden: number; foto_url: string; eliminado_en: string | null }[] | null;
  companeros: { eliminado_en: string | null; perfil: FilaDePerfil }[] | null;
};

/** Lo que se le pide a la base. Los nombres de las uniones son los de la base. */
export const COLUMNAS_DE_SALIDA = `
  id, titulo, fecha, descripcion, actividades, nivel_esfuerzo, largo_km,
  desnivel_positivo_m, desnivel_negativo_m, archivo_url, linea_simplificada, creado_en,
  perfil:perfiles!salidas_perfil_id_fkey(id, nombre, avatar_url),
  fotos:salidas_fotos(orden, foto_url, eliminado_en),
  companeros:salidas_companeros(eliminado_en, perfil:perfiles!salidas_companeros_perfil_id_fkey(id, nombre, avatar_url))
`;

export const NOMBRE_SI_NO_TIENE = "Sin nombre";

function leerPerfil(fila: FilaDePerfil): PerfilBreve | null {
  if (!fila) return null;
  return {
    id: fila.id,
    nombre: fila.nombre?.trim() || NOMBRE_SI_NO_TIENE,
    avatarUrl: fila.avatar_url,
  };
}

function numeroONada(valor: number | string | null): number | null {
  if (valor === null) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function leerSalida(fila: FilaDeSalida): Salida {
  const fotos = (fila.fotos ?? [])
    .filter((foto) => !foto.eliminado_en)
    .sort((a, b) => a.orden - b.orden)
    .map((foto) => foto.foto_url);

  const companeros = (fila.companeros ?? [])
    .filter((companero) => !companero.eliminado_en)
    .map((companero) => leerPerfil(companero.perfil))
    .filter((perfil): perfil is PerfilBreve => perfil !== null);

  return {
    id: fila.id,
    perfil: leerPerfil(fila.perfil) ?? {
      id: "",
      nombre: NOMBRE_SI_NO_TIENE,
      avatarUrl: null,
    },
    titulo: fila.titulo,
    fecha: fila.fecha,
    descripcion: fila.descripcion?.trim() || null,
    actividades: fila.actividades ?? [],
    nivelEsfuerzo: fila.nivel_esfuerzo,
    largoKm: numeroONada(fila.largo_km),
    desnivelPositivoM: fila.desnivel_positivo_m,
    desnivelNegativoM: fila.desnivel_negativo_m,
    archivoUrl: fila.archivo_url,
    linea: leerLinea(fila.linea_simplificada),
    fotos,
    companeros,
    creadoEn: fila.creado_en,
  };
}

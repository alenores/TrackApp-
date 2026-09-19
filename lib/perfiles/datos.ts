import { cache } from "react";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { traerUsuario } from "@/lib/cuenta/sesion";
import type { CategoriaUsuario, Perfil } from "@/types/database";

/**
 * Acceso a la tabla de perfiles.
 *
 * Hay tres categorías: administrador, premium y normal. Qué puede hacer cada
 * una se define función por función, a medida que cada función se define
 * (ver docs/USUARIOS.md). Acá solo se lee la categoría.
 */

type Fila = {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  categoria: CategoriaUsuario;
  creado_en: string;
  actualizado_en: string;
};

const COLUMNAS = "id, nombre, avatar_url, categoria, creado_en, actualizado_en";

function leer(fila: Fila): Perfil {
  return {
    id: fila.id,
    nombre: fila.nombre,
    avatarUrl: fila.avatar_url,
    categoria: fila.categoria,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

/** El perfil de quien está usando la app. `null` si no hay sesión. */
export const traerMiPerfil = cache(async (): Promise<Perfil | null> => {
  const usuario = await traerUsuario();
  if (!usuario?.id) return null;

  const supabase = await crearClienteEnElServidor();
  const { data, error } = await supabase
    .from("perfiles")
    .select(COLUMNAS)
    .eq("id", usuario.id)
    .is("eliminado_en", null)
    .maybeSingle();

  if (error || !data) return null;

  return leer(data as unknown as Fila);
});

/**
 * ¿Quien está usando la app es el administrador?
 *
 * La base ya lo verifica por su cuenta en cada escritura, así que esto no es la
 * defensa: es para no mostrar botones que después van a fallar.
 */
export async function soyAdministrador(): Promise<boolean> {
  const perfil = await traerMiPerfil();
  return perfil?.categoria === "administrador";
}

/** Varios perfiles de una, para mostrar quién subió cada cosa. */
export async function traerPerfiles(ids: string[]): Promise<Map<string, Perfil>> {
  const unicos = [...new Set(ids)].filter(Boolean);
  if (unicos.length === 0) return new Map();

  const supabase = await crearClienteEnElServidor();
  const { data, error } = await supabase
    .from("perfiles")
    .select(COLUMNAS)
    .in("id", unicos)
    .is("eliminado_en", null);

  if (error || !data) return new Map();

  return new Map(
    (data as unknown as Fila[]).map((fila) => [fila.id, leer(fila)]),
  );
}

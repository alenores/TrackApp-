import type { CategoriaUsuario } from "@/types/database";

/** El contenido marcado del mapa es curado por Administrador y Premium. */
export function puedeSumarAlMapa(categoria: CategoriaUsuario | null): boolean {
  return categoria === "administrador" || categoria === "premium";
}

/** Premium cambia lo propio; Administrador puede cambiar cualquier marca. */
export function puedeCambiarDelMapa(
  categoria: CategoriaUsuario | null,
  miPerfilId: string | null,
  autorId: string,
): boolean {
  return categoria === "administrador" ||
    (categoria === "premium" && miPerfilId !== null && miPerfilId === autorId);
}

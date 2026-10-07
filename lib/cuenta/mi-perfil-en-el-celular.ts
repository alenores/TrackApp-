/**
 * Quién soy, guardado en el celular.
 *
 * **En el cerro no se le puede preguntar a la base.** La navegación necesita
 * saber qué anotaciones son tuyas —para dejarte cambiarlas y para la casilla
 * «las mías»— sin salir a internet. Se anota cada vez que la app abre con la
 * sesión confirmada, y se borra al cerrar sesión.
 */

const CLAVE = "trackapp-mi-perfil";
const CLAVE_CATEGORIA = "trackapp-mi-categoria";
const EVENTO_PERFIL = "trackapp-mi-perfil-cambio";

export function mirarMiPerfil(avisar: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENTO_PERFIL, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO_PERFIL, avisar);
    window.removeEventListener("storage", avisar);
  };
}

export function anotarMiPerfil(perfilId: string, categoria: "administrador" | "premium" | "normal"): void {
  try {
    if (localStorage.getItem(CLAVE) !== perfilId) localStorage.setItem(CLAVE, perfilId);
    localStorage.setItem(CLAVE_CATEGORIA, categoria);
    window.dispatchEvent(new Event(EVENTO_PERFIL));
  } catch {
    // Sin guardado, la navegación no sabe cuáles son tuyas: no rompe nada más.
  }
}

/**
 * ¿Quien usa el celular es el administrador? Puede cambiar y borrar cualquier
 * anotación, también desde el cerro. La base lo verifica igual al subir.
 */
export function categoriaGuardada(): "administrador" | "premium" | "normal" | null {
  try {
    const categoria = localStorage.getItem(CLAVE_CATEGORIA);
    return categoria === "administrador" || categoria === "premium" || categoria === "normal" ? categoria : null;
  } catch {
    return null;
  }
}

export function miPerfilGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function olvidarMiPerfil(): void {
  try {
    localStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE_CATEGORIA);
    localStorage.removeItem("trackapp-soy-administrador");
    window.dispatchEvent(new Event(EVENTO_PERFIL));
  } catch {
    // Ídem.
  }
}

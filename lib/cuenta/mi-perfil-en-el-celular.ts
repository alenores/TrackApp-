/**
 * Quién soy, guardado en el celular.
 *
 * **En el cerro no se le puede preguntar a la base.** La navegación necesita
 * saber qué anotaciones son tuyas —para dejarte cambiarlas y para la casilla
 * «las mías»— sin salir a internet. Se anota cada vez que la app abre con la
 * sesión confirmada, y se borra al cerrar sesión.
 */

const CLAVE = "trackapp-mi-perfil";
const CLAVE_ADMINISTRADOR = "trackapp-soy-administrador";

export function anotarMiPerfil(perfilId: string, soyAdministrador: boolean): void {
  try {
    if (localStorage.getItem(CLAVE) !== perfilId) localStorage.setItem(CLAVE, perfilId);
    localStorage.setItem(CLAVE_ADMINISTRADOR, soyAdministrador ? "1" : "0");
  } catch {
    // Sin guardado, la navegación no sabe cuáles son tuyas: no rompe nada más.
  }
}

/**
 * ¿Quien usa el celular es el administrador? Puede cambiar y borrar cualquier
 * anotación, también desde el cerro. La base lo verifica igual al subir.
 */
export function soyAdministradorGuardado(): boolean {
  try {
    return localStorage.getItem(CLAVE_ADMINISTRADOR) === "1";
  } catch {
    return false;
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
    localStorage.removeItem(CLAVE_ADMINISTRADOR);
  } catch {
    // Ídem.
  }
}

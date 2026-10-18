/**
 * Escape en la computadora hace lo mismo que la cruz de cerrar.
 *
 * Hay una sola lista, en el orden en que se abrieron. Escape cierra solo la de
 * adelante: si hay una ventana encima de un panel, cierra la ventana y el
 * panel se queda. Apretar Escape no recorre la lista ni cierra todo junto.
 *
 * La cruz y el atrás del celular se anotan acá. Si las dos pertenecen a lo
 * mismo, queda última la que se anotó después y Escape llama una sola.
 */

const pila: Array<() => void> = [];
let escuchando = false;

export type TeclaDeEscape = {
  key: string;
  repeat?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  defaultPrevented?: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
};

/** Anota un cierre. Al dejar de mostrarse, hay que soltarlo para no cerrar algo que ya no está. */
export function anotarCierreConEscape(cerrar: () => void): () => void {
  pila.push(cerrar);
  asegurarEscucha();
  return () => {
    const indice = pila.lastIndexOf(cerrar);
    if (indice >= 0) pila.splice(indice, 1);
  };
}

/** Solo para las pruebas: vuelve a dejar la lista vacía. */
export function olvidarCierresConEscape(): void {
  pila.length = 0;
}

/**
 * Si hay algo para cerrar, cierra solo lo de adelante y se queda con la tecla
 * para que no la use también lo que está detrás.
 */
export function atenderTeclaEscape(evento: TeclaDeEscape): boolean {
  if (evento.key !== "Escape" || evento.repeat || evento.defaultPrevented) return false;
  if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return false;

  const cerrar = pila[pila.length - 1];
  if (!cerrar) return false;

  evento.preventDefault();
  evento.stopPropagation();
  cerrar();
  return true;
}

function asegurarEscucha(): void {
  if (escuchando || typeof window === "undefined") return;
  escuchando = true;
  window.addEventListener("keydown", atenderTeclaEscape, true);
}

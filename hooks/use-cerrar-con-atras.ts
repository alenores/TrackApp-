"use client";

import { useEffect } from "react";

/**
 * Hace que el botón físico de atrás cierre una pantalla emergente en vez de
 * salir de la app.
 *
 * Sin esto, el atrás del celular cierra la app entera estando adentro de un
 * cartel de confirmación, que es exactamente lo contrario de lo que espera
 * cualquiera.
 *
 * Lo usa `Modal` por su cuenta. **No hace falta llamarlo aparte.**
 *
 * El estado del historial va **sin dirección**: si cambiara la dirección,
 * abrir un cartel dispararía un pedido a internet, y sin señal eso termina en
 * pantalla en blanco.
 */
export function useCerrarConAtras(abierto: boolean, cerrar: () => void): void {
  useEffect(() => {
    if (!abierto) return;

    window.history.pushState({ emergenteAbierta: true }, "");

    const alVolver = () => cerrar();
    const alPresionarEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        // Vuelve atrás para no dejar el estado que se agregó al historial.
        window.history.back();
      }
    };

    window.addEventListener("popstate", alVolver);
    window.addEventListener("keydown", alPresionarEscape);

    return () => {
      window.removeEventListener("popstate", alVolver);
      window.removeEventListener("keydown", alPresionarEscape);

      // Si la emergente se cerró con la X o con un botón, hay que sacar el
      // estado que quedó puesto, si no el próximo atrás no hace nada visible.
      if (window.history.state?.emergenteAbierta) {
        window.history.back();
      }
    };
  }, [abierto, cerrar]);
}

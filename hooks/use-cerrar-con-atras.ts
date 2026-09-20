"use client";

import { useEffect } from "react";
import {
  abrirEnElHistorial,
  cerrarEnElHistorial,
  seguirDeLargoSiSobra,
} from "@/lib/emergentes/historial";

/**
 * Hace que el botón físico de atrás cierre una pantalla emergente en vez de
 * salir de la app.
 *
 * Sin esto, el atrás del celular cierra la app entera estando adentro de un
 * cartel de confirmación, que es exactamente lo contrario de lo que espera
 * cualquiera.
 *
 * Lo usa `Emergente` por su cuenta. **No hace falta llamarlo aparte.**
 *
 * El estado del historial va **sin dirección**: si cambiara la dirección,
 * abrir un cartel dispararía un pedido a internet, y sin señal eso termina en
 * pantalla en blanco.
 *
 * Las cuentas del historial no están acá sino en `lib/emergentes/historial.ts`,
 * que es donde se explica por qué cerrar con un botón **no** vuelve atrás.
 */

let escuchando = false;

function noHacerApretarDosVeces(): void {
  if (escuchando || typeof window === "undefined") return;
  escuchando = true;
  window.addEventListener("popstate", () => {
    seguirDeLargoSiSobra();
  });
}

export function useCerrarConAtras(abierto: boolean, cerrar: () => void): void {
  useEffect(() => {
    if (!abierto) return;

    noHacerApretarDosVeces();
    abrirEnElHistorial();

    const alVolver = () => cerrar();
    const alPresionarEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") cerrar();
    };

    window.addEventListener("popstate", alVolver);
    window.addEventListener("keydown", alPresionarEscape);

    return () => {
      window.removeEventListener("popstate", alVolver);
      window.removeEventListener("keydown", alPresionarEscape);
      cerrarEnElHistorial();
    };
  }, [abierto, cerrar]);
}
